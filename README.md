# FunPro

A fun, light-weight and zero-dependency lib for functional programming in JS.

Integrates with [Ramda](http://ramdajs.com/) and partly the
[Fantasyland](https://github.com/fantasyland/fantasy-land) Spec.
Inspired by [Elm](http://elm-lang.org/), [Haskell](https://www.haskell.org/),
[Folktale](http://folktale.origamitower.com/) and
[Prof. Frisby](https://drboolean.gitbooks.io/mostly-adequate-guide/).

__________________________________________________________________
Goals for v1:
- remove all dependencies (Done)
- make filesize as small as possible
- possibly remove transpilation (first check if it necessary)
_________________________________________________________________

```sh
npm i -S funpro
```
in your js
```js
// commonJS
const { union, matchWith, Maybe, Result, Task } = require('funpro');

// ES6
import { union, matchWith, Maybe, Result, Task } from 'funpro';
```

Also check out:

- the [guide](https://christophp.gitbooks.io/funpro/), with JS FP background, tips and usage examples
- the official [API docs](https://christophp.gitbooks.io/funpro/content/ch5.html)


## Union types (Algebraic data types)

Union types or ADTs let you model your domain more precisely than with
other data type primitives like boolean, strings or integers.

An optional value can use the `Maybe` type.
```js
const listHead = list =>
  list.length === 0 ? Maybe.Nothing() : Maybe.Just(list[0]);
```

An operation that may fail can be represented with a `Result`.
Maybe, Result

This let's you write super safe functions like this:
```js
const safeJsonParse = val => {
  try {
    return Result.Ok(JSON.parse(val));
  } catch (e) {
    return Result.Err(e);
  }
};
```

You don't have to worry about the error and map away.
At some point you pattern match to handle the different cases.

This could also be thinkable:
```js
const safeDate = val => {
  try {
    return Result.Ok(new Date(val));
  } catch (e) {
    return Result.Err(e);
  }
};
```
No more weird try catch blocks. Yay! :-)

No how do I use the values when they are wrapped into a context like that?

The answer is pattern matching:

```js
const maybePrice = getItemPrice(item); // returns a Maybe with the price or Nothing

const displayPrice = matchWith(maybePrice, {
  Just: val => `${val.toFixed(2)} $`,
  Nothing: () => 'not for sale',
})
```

There are also functions to map, chain, etc with these types.

## Custom union types

It's also possible to create your own union types. Using boolean to model things
is very limited, especially if you need more than two states. So for a page
you could use something like this.

```js
// for each value specify the number of arguments it can carry.
const PageState = union({
  Loading: 0,
  Loaded: 1,
  Errored: 1,
})
```

`Loading` doesn't need any arguments. `Loaded` will need some sort of content.
`Errored` should contain some kind of error message or reason why it failed.

With pattern matching all the cases can be handled it one place.

```js
// create a pageState
// this could also be Page.Loading() or Page.Errored('Oh no!')
const pageState = PageState.Loaded({ user: {name: 'Peter', age: 42} });

const pageContent = matchWith(pageState, {
  Loading: () => 'Loading...',
  Loaded: ({ user: { name, age } }) => `${name} is ${age} old`,
  Errored: msg => `Something went wrong: ${msg}`,
})
```

This is much more powerful than the dull ON/OFF logic that booleans provide.

Give booleans the finger and make impossible states impossible.

## IO and Async management

To keep your code free of side-effects this lib gives you s `Task` for asynchronous
things and basically anything that would be considered a side-effect.

### Why not a Promise?

Promises always execute their action upon creation. There is no real way for
operating on a promise without already kicking of the first task.

Tasks won't to anything until you pull the trigger and call `.run()`.
This allows you to map or chain or pass around your task while knowing it will
only be execute when run is called.

Ideally you only call run once in your entire program and chain or map other
tasks onto the initial one. That way you can make sure that you're entire code
does not have side-effects except for that isolated place where you call `.run()`.

```js
// function that kicks of your app
const startApp = () => loadAssets();
main = Task.of(startApp)
  .chain(() => fetchDataTask)
  .onError(err => {
    // catch or log the error
  })

// then run it somewhere
main.run()
```

## Random
### The mission

I think FP is awesome, this is my attempt to sneak more FP code into the JS world.
If I could choose I, would prefer a true function language like `Elm` or `Haskell`,
but sometimes there is no way around JS and luckily, it is also very capable of
writing some FP code.

### What's up with the name?

Apparently there are no cool names availbale on npm anymore. The all of a sudden
I realized, that when taking the first 3 letters from  `functional` and `programming`,
you get the words `fun` and `pro`. Tah-Dah.
