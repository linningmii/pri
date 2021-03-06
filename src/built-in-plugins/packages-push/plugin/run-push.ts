import * as inquirer from 'inquirer';
import * as path from 'path';
import { exec } from '../../../utils/exec';
import { addAllAndCommit, isWorkingTreeClean } from '../../../utils/git-operate';
import { globalState } from '../../../utils/global-state';
import { logFatal, spinner } from '../../../utils/log';
import { getPackages } from '../../../utils/packages';

export async function packagesPush(packageName: string, message: string) {
  const packages = await getPackages();

  if (!packageName) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Choose packages to push:`,
        name: 'packageName',
        type: 'list',
        choices: packages.map(eachPackage => eachPackage.name)
      }
    ]);

    packageName = inquirerInfo.packageName;
  }

  const packageInfo = packages.find(eachPackage => eachPackage.name === packageName);

  if (!packageInfo) {
    logFatal(`${packageName} not exist`);
  }

  const packagePath = path.join(globalState.projectRootPath, packageInfo.path);

  if (await isWorkingTreeClean(packagePath)) {
    logFatal(`${packageName} has not modified.`);
  }

  if (!message) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Commit message:`,
        name: 'message',
        type: 'input'
      }
    ]);

    message = inquirerInfo.message;
  }

  // TODO:
  // change package.json deps

  await spinner(`push ${packageName}`, async () => {
    await addAllAndCommit(message || 'update.', packagePath);

    await exec(['git push'].join(';'), { cwd: packagePath });
  });
}
