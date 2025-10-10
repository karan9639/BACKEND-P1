const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => (next(error)));
};

export { asyncHandler };

// // const asyncHandler = () => {};
// // const asyncHandler = (fn) => () => {}
// // const asyncHandler = (fn) => async () => {}

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next);
//     }
//     catch (error) {
//         res.status(error.code || 500).json({ 
//             message: error.message,
//             success: false
//         });
//     }
// }