const AWS = require('aws-sdk')
const ssm = new AWS.SecretsManager({})

const AuthState = {
  ALLOW: 'Allow',
  DENY: 'Deny',
  UNAUTHORIZED: 'Unauthorized'
}

const generateAuthPolicy = (principalId, effect, resource) => {
  let authResponse = {}

  authResponse.principalId = principalId
  if (effect && resource) {
    let policyDocument = {}
    policyDocument.Version = '2012-10-17'
    policyDocument.Statement = []
    let statementOne = {}
    statementOne.Action = 'execute-api:Invoke'
    statementOne.Effect = effect
    statementOne.Resource = resource
    policyDocument.Statement[0] = statementOne
    authResponse.policyDocument = policyDocument
  }

  return authResponse
}

const checkAuthorization = async authToken => {
  try {
    let credentials = getCredentialsFromBasicAuthToken(authToken)
    let secret = await getJSONSecret(process.env.SSM_USERS_SECRET_ID)
    let user = secret.users.find(u => {
      return u.username === credentials.username && u.password === credentials.password
    })

    if (!user) {
      return { username: credentials.username, state: AuthState.DENY }
    } else {
      return { username: credentials.username, state: AuthState.ALLOW }
    }
  } catch (err) {
    return { username: null, state: AuthState.UNAUTHORIZED }
  }
}

const getCredentialsFromBasicAuthToken = authToken => {
  try {
    let encodedCreds = authToken.split(' ')[1]
    let plainCreds = (Buffer.from(encodedCreds, 'base64')).toString().split(':')
    let username = plainCreds[0]
    let password = plainCreds[1]
    return { username, password }
  } catch (err) {
    throw Error('Error while extracting credentials from token. ' + err)
  }
}

const getJSONSecret = secretId => {
  return new Promise((resolve, reject) => {
    ssm.getSecretValue({ SecretId: secretId }, (err, data) => {
      if (err) {
        reject(err)
      }

      if (!('SecretString' in data)) {
        reject(Error('Invalid secret format.'))
      }

      try {
        let parsedSecret = JSON.parse(data.SecretString)
        resolve(parsedSecret)
      } catch (err) {
        reject(err)
      }
    })
  })
}

export { AuthState, checkAuthorization, generateAuthPolicy }
