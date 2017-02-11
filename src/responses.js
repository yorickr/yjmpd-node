const response = (code, success, message, data = null) => {
    return {
        code,
        success,
        message,
        data,
    };
};

export default response;
