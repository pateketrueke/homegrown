module.exports = ({ useEffect, API }) => async function updatePassword({ req, args }) {
  await useEffect(({ input }) => input.session(req, args, 'User.UpdatePasswordParams'));

  const {
    input: {
      oldPassword, newPassword, confirmPassword,
    },
  } = args;

  return API.User.updatePassword({
    guid: req.guid,
    params: {
      userId: req.user.id,
      oldPassword,
      newPassword,
      confirmPassword,
    },
  });
};