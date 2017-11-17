'use strict';

module.exports = Grown => {
  Grown.module('Application.BaseController', {
    title: 'Untitled',
  });

  const HomeController = Grown.Application.BaseController({
    title: 'Titled',
    methods: {
      index(ctx) {
        ctx.render('welcome');
      },
    },
  });

  console.log(HomeController);
  console.log(HomeController.new());

  Grown.module('Application.AdminController', {
    title: 'Administration',
    include: Grown.Application.BaseController,
  });

  console.log(Grown.Application.AdminController);
  console.log(Grown.Application.AdminController.new());

  Grown.module('Application.Models');

  const User = Grown.Application.Models('User');

  // later...
  // FIXME: how to "include" foreign impls? e.g. Sequelize models?
  Grown.Application.Models('User', {
    foo: 'bar',
    props: {
      baz: 'buzz',
    },
  });

  console.log(User);
  console.log(User.new());
};
