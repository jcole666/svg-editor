import { missing } from './missing.mjs';

export default class BadImportPlugin {
  activate() {
    void missing;
  }
}
