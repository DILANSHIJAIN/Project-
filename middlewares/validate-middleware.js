const validate = (schema) => async (req, res, next) => {

  try {

    const parsedBody = await schema.parseAsync(req.body);

    req.body = parsedBody;

    next();

  } catch (err) {

    console.log(err);

    const status = 422;

    const message = "Fill the details properly";

    const extraDetails =
      err.issues?.[0]?.message || "Invalid input";

    const error = {
      status,
      message,
      extraDetails,
    };

    next(error);
  }
};

module.exports = validate;