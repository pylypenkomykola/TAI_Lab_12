'use strict';

import * as _ from 'lodash';
import Promise from 'bluebird';
import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import mongoConverter from '../service/mongoConverter';
import applicationException from '../service/applicationException';

const userRole = {
  admin: 'admin',
  user:  'user'
};

const userRoles = [userRole.admin, userRole.user];

const userSchema = new mongoose.Schema({
  email:   {type: String, required: true, unique: true},
  name:    {type: String, required: true, unique: true},
  role:    {type: String, enum: userRoles, default: userRole.user, required:false},
  active:  {type: Boolean, default: false, required: false},
  isAdmin: {type: Boolean, default: false, required: false}
},{
  collection: 'mp_user'
});

userSchema.plugin(uniqueValidator);

const UserModel = mongoose.model('mp_user',userSchema);

function createNewOrUpdate(user) {
  return Promise.resolve().then(()=>{
    if(!user.id) {
      user.active = true;
      return new UserModel(user).save().then(result => {
        if (result) {
          return mongoConverter(result);
        }
      });
    }else{
      return UserModel.findByIdAndUpdate(user.id,_.omit(user,'id'),{new: true});
    }
  }).catch(error =>{
    if('ValidationError' === error.name) {
      error = error.errors[Object.keys(error.errors)[0]];
      throw applicationException.new(applicationException.BAD_REQUEST, error.message);
    }
    throw error;
  });
}

async function getByEmailOrName(name) {
  const result = await UserModel.findOne({$or: [{email:name},{name: name}]});
  if (result) {
    return mongoConverter(result);
  }
  throw applicationException.new(applicationException.NOT_FOUND, 'User not found');
}

async function get(id) {
  const result = await UserModel.findOne({ _id: id });
  if (result) {
    return mongoConverter(result);
  }
  throw applicationException.new(applicationException.NOT_FOUND, 'User not found');
}

async function removeById(id) {
  return await UserModel.findByIdAndRemove(id);
}

export default {
  createNewOrUpdate: createNewOrUpdate,
  getByEmailOrName: getByEmailOrName,
  get: get,
  removeById: removeById,

  userRole: userRole,
  model: UserModel
}
