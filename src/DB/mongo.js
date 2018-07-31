import mongoose from 'mongoose';
import Account from './account';
import Project from './project';
import Subject from './subject';
import Item from './item';

const account = new Account();
const project = new Project();
const subject = new Subject();
const item = new Item();

mongoose.connection.on('error', console.error);
mongoose.connection.once('open', () => {
  console.log(`connection to mongoDB.`);
});

export function connect(url) {
  mongoose.connect(url);
}

// TODO Disconnect()

export function getAccount() {
  return account;
}

export function getProject() {
  return project;
}

export function getSubject() {
  return subject;
}

export function getItem() {
  return item;
}