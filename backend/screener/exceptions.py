import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
  """Custom DRF exception handler ensuring ALL API errors return clean JSON

  response instead of crashing with raw 500 HTML exception backtraces.
  """
  # Call REST framework's default exception handler first to get standard response
  response = exception_handler(exc, context)

  if response is not None:
    # Standardize DRF error response object structure
    if isinstance(response.data, dict):
      if 'error' not in response.data and 'detail' in response.data:
        response.data['error'] = response.data['detail']
    elif isinstance(response.data, list):
      response.data = {'error': response.data}
    return response

  # Handle unhandled Python runtime exceptions (500 Internal Server Error)
  view_name = (
      context.get('view').__class__.__name__
      if context.get('view')
      else 'UnknownView'
  )
  logger.error(
      f'[Unhandled API Error in {view_name}]: {exc}', exc_info=True
  )

  return Response(
      {
          'error': 'An internal server error occurred in QuantEngine backend.',
          'detail': str(exc),
          'status_code': status.HTTP_500_INTERNAL_SERVER_ERROR,
      },
      status=status.HTTP_500_INTERNAL_SERVER_ERROR,
  )
