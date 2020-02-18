VOLUMES="-v $(pwd)/index.js:/test/index.js -v $(pwd)/index.test.js:/test/index.test.js -v $(pwd)/package.json:/test/package.json -v $(pwd)/jest.config.js:/test/jest.config.js"

test()
{
  VERSION=$1
  echo "TESTING WITH NODE VERSION ${VERSION}";
  docker run -it ${VOLUMES} -w "/test" node:${VERSION}-alpine sh -c "npm i && npm test";
}

#test 4
test 6
test 8
test 10
test 12
