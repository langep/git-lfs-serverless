# Git LFS Serverless 

A Git LFS server running in serverless environment using AWS Lambda and S3. This works by creatign presigned 
S3 URLs after using HTTP Basic Authentication backed by AWS Secret Manager.

# TODO:
- Error handling if files are missing
- Implement [Git LFS File Locking API](https://github.com/git-lfs/git-lfs/blob/master/docs/api/locking.md)

# Requirements
- [serverless](https://serverless.com/) Install with `npm install serverless -g`
- [AWS CLI](https://aws.amazon.com/cli/) Optional but required if you want to create credentials from CLI
- [Git LFS](https://git-lfs.github.com/) version 2.7 or newer

You can find more information about the serverless framework [here](https://serverless.com/framework/docs/providers/aws/guide/intro/).

# Setup the API

## Create user credentals
You need to configure user credentals otherwise it will be possible with anyone that sees your `.lfsconfig` to upload and download anything to your S3 bucket. The allowed user credentials need to be configured in the AWS Secret Manager
as JSON of the following format:
```
{
    "users" : [
        {"username": "some-username", "password": "somepassword"},
        {"username": "some-other-username", "password": "some-other-password"}
    ]
}
```

**Don't actually use these credentals.**
For example, if you want to create a user "admin" with password "secret" you can run following command: 
```
aws secretmanager put-secret-value --secret-id git-lfs-serverless-users --secret-string "{\"users\": [{\"username\": \"admin\", \"password\": \"secret\"}]}"
```

## Deploy serverless functions
Clone this repositroy and then run 
```
sls deploy
```

You will se output similar to this and you want to make a note of the `<base-url>`.
```
Service Information
service: git-lfs-serverless
stage: dev
region: us-east-1
stack: git-lfs-serverless-dev
resources: 17
api keys:
  None
endpoints:
  POST - <base-url>/objects/batch
functions:
  authorizer: git-lfs-serverless-dev-authorizer
  batch: git-lfs-serverless-dev-batch
layers:
  None
```

# Prepare your repository

You want to follow the offical [Getting Started](https://git-lfs.github.com/) guide on Git LFS. 

Create a `.lfsconfig` file in the root of your repository and add the `base-url` from above:

```
[lfs]
url = <base-url>
```

In addition, make sure you disable automatic content type detection. Otherwise, you won't be able to upload or download with the presigned S3 URLs.

```
git config lfs.contentType false
```







