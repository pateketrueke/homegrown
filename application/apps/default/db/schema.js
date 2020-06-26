/* eslint-disable */
'use strict';
module.exports = {
  up: (queryInterface, dataTypes) => [
    () =>
      queryInterface.createTable('tokens', {
        id: {
          type: dataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        type: {
          type: dataTypes.ENUM('VALIDATE_EMAIL', 'RECOVER_PASSWORD'),
        },
        token: {
          type: dataTypes.STRING,
        },
        userId: {
          type: dataTypes.INTEGER,
        },
        expirationDate: {
          type: dataTypes.DATE,
        },
        createdAt: {
          type: dataTypes.DATE,
        },
        updatedAt: {
          type: dataTypes.DATE,
        },
      }),
    () =>
      queryInterface.createTable('users', {
        id: {
          type: dataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        platform: {
          type: dataTypes.STRING,
        },
        identifier: {
          type: dataTypes.STRING,
        },
        email: {
          type: dataTypes.STRING,
        },
        role: {
          type: dataTypes.ENUM('ADMIN', 'GUEST', 'ROOT', 'USER'),
        },
        password: {
          type: dataTypes.STRING,
        },
        verified: {
          type: dataTypes.BOOLEAN,
        },
        deletedAt: {
          type: dataTypes.DATE,
        },
        createdAt: {
          type: dataTypes.DATE,
        },
        updatedAt: {
          type: dataTypes.DATE,
        },
      }),
    () =>
      queryInterface.createTable('sessions', {
        id: {
          type: dataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        token: {
          type: dataTypes.STRING,
        },
        email: {
          type: dataTypes.STRING,
        },
        expirationDate: {
          type: dataTypes.DATE,
        },
        role: {
          type: dataTypes.ENUM('ADMIN', 'GUEST', 'ROOT', 'USER'),
        },
        // user <User>
        userId: {
          type: dataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        createdAt: {
          type: dataTypes.DATE,
        },
        updatedAt: {
          type: dataTypes.DATE,
        },
      }),
  ],
  down: (queryInterface, dataTypes) => [
    () =>
      queryInterface.dropTable('sessions'),
    () =>
      queryInterface.dropTable('users'),
    () =>
      queryInterface.dropTable('tokens'),
  ],
};