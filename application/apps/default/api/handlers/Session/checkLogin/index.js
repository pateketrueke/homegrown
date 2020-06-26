module.exports = ({ User, Session }) => async function checkLogin({ request }) {
  const { params: { type, auth } } = request;

  const [user] = await User.findOrCreate({
    where: {
      platform: type,
      identifier: auth.id,
    },
    defaults: {
      email: auth.email,
      role: 'GUEST',
      verified: true,
    },
    hooks: false,
  });

  const session = await Session.create({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token: session.token,
    expirationDate: session.expirationDate,
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
    },
  };
};