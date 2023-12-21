import { StatusCodes } from 'http-status-codes'
import Queue from 'bull'
import {
  createPost,
  fetchTags,
  generateUUID,
  getPostAuthorId,
  slugify,
} from '../helpers/post.js'

export const duplicatePost = async (req, res) => {
  const result = req.body
  if (result) {
    res.status(StatusCodes.OK).json({ msg: 'transfered to api server...' })
  }
  const { title, categories } = result
  //fetch tags
  const tags = await fetchTags()
  console.log('==================Post Details==================')
  // const items = JSON.parse(categories);
  // let postCategories = parseArrayFromString(categories);
  const postCategories = JSON.stringify(categories)
  // console.log(items)
  console.log(`Post Title: ${title} \nPost Categories:`, postCategories)
  // Filter tags based on items array
  console.log(`==================All Available Tags==================`)
  const filteredTags = tags.data.filter((item) => {
    try {
      const tagCategories = item.attributes.categories
      if (tagCategories) {
        console.log(`Tag Name: ${item.attributes.name}`)
        console.log(`Tag Categories: ${tagCategories}`)
        return tagCategories.some((category) =>
          postCategories.includes(category)
        )
      }
    } catch (error) {
      console.error('Error parsing JSON:', error)
    }
    return false
  })
  if (filteredTags.length === 0) {
    console.log(
      'Post will not be distributed to any frontend as no matching categories found '
    )
    return
  }
  console.log(
    '==================Post will be distributed to following frontends:=================='
  )
  console.log(filteredTags)
  //defining queue
  const myFirstQueue = new Queue(generateUUID(), {
    redis: {
      port: parseInt(process.env.REDIS_PORT) || 6379,
      host: process.env.REDIS_HOST || '127.0.0.1',
      password: process.env.REDIS_PASSWORD || '',
    },
  })
  // adding each tag to a job

  let initialNewsSource = 'liqueousnews'
  let currentNewsSource = initialNewsSource

  for (let index = 0; index < filteredTags.length; index++) {
    const tag = filteredTags[index]
    await myFirstQueue
      .add({ ...result, tag, postCategories, newsSource: currentNewsSource })
      .then(() => {
        currentNewsSource = tag.attributes.name
      })
    if (index + 1 === filteredTags.length) {
      console.log('All tags are added to the queue')
    }
  }
  // filteredTags.forEach(async (tag, index) => {

  //   await myFirstQueue
  //     .add({ ...result, tag, postCategories, newsSource: currentNewsSource })
  //     .then(() => {
  //       if (index + 1 === filteredTags.length) {
  //         console.log("All tags are added to the queue");
  //       }
  //       console.log(tag.attributes.name);
  //       // Set the currentNewsSource to the name of the current tag for the next iteration.
  //       currentNewsSource = tag.attributes.name;
  //       console.log(currentNewsSource);
  //     });
  // });
  //processing each job
  myFirstQueue.process(async (job, done) => {
    try {
      const {
        title,
        description,
        content,
        imgUrl,
        newsDate,
        timeToRead,
        postCategories,
        layoutCategory,
        seoTags,
        author,
        newsSource,
      } = job.data
      const tagId = job.data.tag.id
      const postAuthorId = await getPostAuthorId(job.data.tag.attributes.name)
      // console.log(postAuthorId);
      // console.log("duplicating post content...");
      // const generatedContent = await askGpt(content);
      // const newTitle = generatedContent.title;
      // const newContent = generatedContent.content;
      // const newSlug = `${slugify(newTitle)}-${tagId}`;
      console.log('news source', newsSource)
      const newSlug = `${slugify(title)}-${tagId}`
      const requestBody = {
        data: {
          title: title,
          description: description,
          slug: newSlug,
          content: content,
          newsSource: newsSource,
          imgUrl: imgUrl,
          newsDate: newsDate,
          timeToRead: timeToRead,
          categories: postCategories,
          layoutCategory: layoutCategory,
          seoTags: seoTags,
          author: author,
          tag: {
            connect: [parseInt(tagId)],
          },
        },
      }
      if (postAuthorId !== null) {
        requestBody.data.post_author = {
          connect: [parseInt(postAuthorId)],
        }
      }
      createPost(requestBody)
      done()
    } catch (error) {
      console.log(error)
    }
  })
  //listening to events and logging them
  myFirstQueue.on('completed', (job) => {
    console.log(
      `Job with id ${job.id} has been completed for tag ${job.data.tag.attributes.name}`
    )
  })
}
