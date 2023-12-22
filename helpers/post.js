import { v4 as uuidv4 } from 'uuid'
import * as dotenv from 'dotenv'
dotenv.config()

const strapiUrl = process.env.STRAPI_BASE_URL
const headerOptions = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
}

function getRandomAuthorId(dataArray) {
  const postAuthorsArray = dataArray[0]?.attributes?.post_authors?.data

  if (postAuthorsArray && postAuthorsArray.length > 0) {
    const randomIndex = Math.floor(Math.random() * postAuthorsArray.length)
    const randomAuthorId = postAuthorsArray[randomIndex]?.id
    return randomAuthorId
  } else {
    console.log('No post authors found in the first object of the data array.')
    return null
  }
}

export function generateUUID() {
  return uuidv4().replace(/-/g, '')
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

export async function fetchTags() {
  try {
    const res = await fetch(`${strapiUrl}/api/tags?pagination[start]=0&pagination[limit]=100`, {
      method: 'GET',
      headers: headerOptions,
    })
    return res.json()
  } catch (error) {
    console.log(error)
  }
}

export async function getPostAuthorId(tagName) {
  try {
    const res = await fetch(
      `${strapiUrl}/api/generate-frontends?filters[tagName][$eq]=${tagName}&populate=*`,
      {
        method: 'GET',
        headers: headerOptions,
      }
    )
    const result = await res.json()
    const authorId = getRandomAuthorId(result.data)
    return authorId
  } catch (error) {
    console.log(error)
  }
}

export async function createPost(requestBody) {
  const res = await fetch(`${strapiUrl}/api/generated-posts`, {
    method: 'POST',
    headers: headerOptions,
    body: JSON.stringify(requestBody),
  })
  console.log(res.status)
}
