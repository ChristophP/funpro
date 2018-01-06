# PURE **Coming soon**


Integrates with Ramda, Fantasyland Spec.
Inspired by Elm, Haskell, Folktale and Prof. Frisby.

## Union types(Algebraic data types)

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
const listHead = list =>
  list.length === 0 ? Maybe.Nothing() : Maybe.Just(list[0]);
```
... or this ...
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

## Custom union types

Union function

## IO and Async management

Task

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
main = Task.of(() => startApp())
  .chain(() => fetchDataTask)
  .onError(err => {
    // catch or log the error
  })

// then run it somewhere
main.run()
```
