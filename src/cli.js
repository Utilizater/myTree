const fs = require('fs');
const path = require('path');

module.exports = function cli(args) {
  const ROOT = path.resolve(args[2]);

  const index = args.findIndex((el) => el === '--depth' || el === '-d');
  const DEEP = index !== -1 ? +args[index + 1] : 0;

  if (Number.isNaN(DEEP)) {
    console.error('depth must be a number');
    return;
  }

  let arr = [];

  let directoryCounter = 0;
  let fileCounter = 0;

  const render = (arr) => {
    for (let y = arr.length - 1; y > -1; y--) {
      for (let x = 0; x < arr[y].length; x++) {
        if (typeof arr[y][x] === 'string') process.stdout.write(`${arr[y][x]}`);
        else process.stdout.write(`${arr[y][x].name}`);
      }
      console.log();
    }
  };

  const fileHandler = (root, parentDir) => {
    if (parentDir) {
      let positionX = null;
      let positionY = null;
      let deep;
      //find parent
      for (let y = 0; y < arr.length; y++) {
        for (let x = 0; x < arr[y].length; x++) {
          if (
            arr[y][x]['directory'] &&
            arr[y][x].directory === parentDir &&
            arr[y][x].type === 'directory'
          ) {
            positionX = x;
            positionY = y;
            const parentDeep = arr[y][x].deep;
            if (DEEP !== undefined && parentDeep === DEEP) {
              return;
            }
            deep = parentDeep + 1;
            break;
          }
        }
      }

      if (positionY !== null && positionX !== null) {
        //create new array row in base of parent row
        const newXRow = [];
        for (let x = 0; x < arr[positionY].length; x++) {
          if (x !== positionX) {
            newXRow.push('   ');
          } else {
            newXRow.push('└──');

            //create new elem
            const type = fs.lstatSync(root).isDirectory()
              ? 'directory'
              : fs.lstatSync(root).isFile()
              ? 'file'
              : null;
            const obj = {
              type,
              name: path.basename(root),
              directory: root,
              deep,
            };

            newXRow.push(obj);

            if (type === 'directory') directoryCounter++;
            if (type === 'file') fileCounter++;
          }
        }
        arr = [...arr.slice(0, positionY), newXRow, ...arr.slice(positionY)];
      } else {
        return;
      }
    } else {
      //first enter
      arr.push([
        {
          type: 'directory',
          name: path.basename(root),
          directory: root,
          deep: 0,
        },
      ]);
      directoryCounter++;
    }

    //check other dirs
    let items = [];
    try {
      items = fs.readdirSync(root);
    } catch {}

    if (items.length !== 0) {
      items.reverse().forEach((item) => {
        fileHandler(root + '/' + item, root);
      });
    } else {
      return;
    }
  };
  fileHandler(ROOT);

  // connect verticals
  for (let y = 0; y < arr.length; y++) {
    for (let x = 0; x < arr[y].length; x++) {
      if (arr[y][x] === '└──') {
        for (let i = y + 1; i < arr.length; i++) {
          if (arr[i][x] === '   ') {
            arr[i][x] = '│  ';
          } else {
            break;
          }
        }
      }
    }
  }

  render(arr);
  console.log(`${directoryCounter} directories, ${fileCounter} files`);
};
