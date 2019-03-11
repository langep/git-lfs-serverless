const AWS = require('aws-sdk')
const s3 = new AWS.S3({ })

const BUCKET_NAME = process.env.BUCKET_NAME

const handleUpload = async request => {
  let { objects } = request
  if (!objects) {
    return errorResponse('Request body misses objects field.')
  }

  let objectsWithUploadUrl = []
  for (let i = 0; i < objects.length; i++) {
    let obj = objects[i]
    let url = await generateUploadUrl(obj)
    let returnObj = {
      'size': obj.size,
      'oid': obj.oid,
      'authenticated': true,
      'actions': {
        'upload': {
          'href': url,
          'expires_in': 6000
        }
      }
    }
    objectsWithUploadUrl.push(returnObj)
  }

  return {
    'statusCode': 200,
    'headers': {
      'Content-Type': 'application/vnd.git-lfs+json'
    },
    'body': JSON.stringify({
      'transfer': 'basic',
      'objects': objectsWithUploadUrl
    })
  }
}

const handleDownload = async request => {
  let { objects } = request
  if (!objects) {
    return errorResponse('Request body misses objects field.')
  }

  let objectsWithDownloadUrl = []
  for (let i = 0; i < objects.length; i++) {
    let obj = objects[i]
    let url = await generateDownloadUrl(obj)
    let returnObj = {
      'size': obj.size,
      'oid': obj.oid,
      'authenticated': true,
      'actions': {
        'download': {
          'href': url,
          'expires_in': 6000
        }
      }
    }
    objectsWithDownloadUrl.push(returnObj)
  }

  return {
    'statusCode': 200,
    'headers': {
      'Content-Type': 'application/vnd.git-lfs+json'
    },
    'body': JSON.stringify({
      'transfer': 'basic',
      'objects': objectsWithDownloadUrl
    })
  }
}

const errorResponse = (message, statusCode = 400) => {
  let body = JSON.stringify({ message })
  return {
    statusCode,
    body
  }
}

const generateUploadUrl = obj => {
  let { oid } = obj
  let params = {
    Bucket: BUCKET_NAME,
    Key: oid,
    Expires: 6000,
    ContentType: 'application/octet-stream'
  }

  let p = new Promise((resolve, reject) => {
    s3.getSignedUrl('putObject', params, (err, url) => {
      if (err) {
        reject(err)
      }
      resolve(url)
    })
  })

  return p
}

const generateDownloadUrl = obj => {
  let { oid } = obj
  let params = {
    Bucket: BUCKET_NAME,
    Key: oid,
    Expires: 6000
  }

  let p = new Promise((resolve, reject) => {
    s3.getSignedUrl('getObject', params, (err, url) => {
      if (err) {
        reject(err)
      }
      resolve(url)
    })
  })

  return p
}

export { errorResponse, handleDownload, handleUpload }
