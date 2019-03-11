import { AuthState, checkAuthorization, generateAuthPolicy } from './lib/authorization'
import { errorResponse, handleUpload, handleDownload } from './lib/batch'

module.exports.authorizer = async (event, context, callback) => {
  let authToken = event.authorizationToken

  let { username, authState } = checkAuthorization(authToken)
  switch (authState) {
    case AuthState.UNAUTHORIZED:
      return callback(AuthState.UNAUTHORIZED)
    case AuthState.DENY:
      return callback(null, generateAuthPolicy(username, AuthState.DENY, event.methodArn))
    case AuthState.ALLOW:
      return callback(null, generateAuthPolicy(username, AuthState.ALLOW, event.methodArn))
    default:
      return callback(AuthState.UNAUTHORIZED)
  }
}

module.exports.batch = async (event, context) => {
  try {
    let request = JSON.parse(event.body)
    switch (request.operation) {
      case 'upload':
        return handleUpload(request)
      case 'download':
        return handleDownload(request)
      default:
        return errorResponse('Invalid operation.')
    }
  } catch (err) {
    return errorResponse('Invalid request body.')
  }
}
