export const sendSuccess = (res, data = null, message = null, statusCode = 200) => {
  const response = { success: true };
  
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  
  if (message) {
    response.message = message;
  }
  
  return res.status(statusCode).json(response);
};

export const sendError = (res, message, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message
  };
  
  if (errors) {
    response.errors = errors;
  }
  
  return res.status(statusCode).json(response);
};
