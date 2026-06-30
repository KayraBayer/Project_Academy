import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/firebase';

function callFunction(name) {
  return httpsCallable(functions, name);
}

export async function callCreateAccount(payload) {
  const result = await callFunction('createAccount')(payload);
  return result.data;
}

export async function callUpdateAccount(payload) {
  const result = await callFunction('updateAccount')(payload);
  return result.data;
}

export async function callDeleteAccount(uid) {
  const result = await callFunction('deleteAccount')({ uid });
  return result.data;
}

export async function callListAccounts() {
  const result = await callFunction('listAccounts')();
  return result.data || [];
}

export async function callCreateTest(payload) {
  const result = await callFunction('createTest')(payload);
  return result.data;
}

export async function callUpdateTest(payload) {
  const result = await callFunction('updateTest')(payload);
  return result.data;
}

export async function callDeleteTest(id) {
  const result = await callFunction('deleteTest')({ id });
  return result.data;
}

export async function callDeleteTests(ids) {
  const result = await callFunction('deleteTests')({ ids });
  return result.data;
}

export async function callCreatePublisher(payload) {
  const result = await callFunction('createPublisher')(payload);
  return result.data;
}

export async function callAssignHomework(payload) {
  const result = await callFunction('assignHomework')(payload);
  return result.data;
}

export async function callSubmitTestAnswers(payload) {
  const result = await callFunction('submitTestAnswers')(payload);
  return result.data;
}

export async function callRecordLogin() {
  const result = await callFunction('recordLogin')();
  return result.data;
}
