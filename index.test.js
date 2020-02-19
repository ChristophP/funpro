import R from 'ramda';
import {union, matchWith, Maybe, Result, Task} from './index';

const unionEquals = val1 => val2 => val1.equals(val2);

describe('union', () => {
  const Perhaps = union({
    Something: 1,
    None: 0,
  });

  describe('create', () => {
    test('a Something has the correct tag.', () => {
      expect(Perhaps.Something(42)).toEqual(expect.objectContaining({
        _ctor: 'Something',
      }));
    });

    test('matches a Something with a value.', () => {
      const perhaps = Perhaps.Something(42);
      const matched = matchWith(perhaps, {
        Something: val => val,
        None: Function.prototype,
      });
      expect(matched).toEqual(42);
    });

    test('a None has the correct tag.', () => {
      expect(Perhaps.None()).toEqual(expect.objectContaining({
        _ctor: 'None',
      }));
    });

    test('matches a None without any values.', () => {
      const perhaps = Perhaps.None();
      const matched = matchWith(perhaps, {
        Something: Function.prototype,
        None: () => 'I am none',
      });
      expect(matched).toEqual('I am none');
    });

    test('throws when matching a non-union type.', () => {
      const badFn = () => matchWith('not a union', {});
      expect(badFn).toThrow();
    });

    test('creates curried constructors', () => {
      const Point = union({Point: 2});
      const Color = union({RGB: 3});
      const Bool = union({True: 0, False: 0});
      expect(Color.RGB(255, 0, 0)).toSatisfy(
        unionEquals(Color.RGB(255)(0)(0))
      );
      expect(Point.Point(1, 0)).toSatisfy(unionEquals(Point.Point(1)(0)));
      expect(Bool.True()).toSatisfy(unionEquals(Bool.True()));
    });
  });

  describe('prototype', () => {
    test('Something and None have the same constructor.', () => {
      const none = Perhaps.None();
      const something = Perhaps.Something(42);
      expect(none.constructor).toEqual(something.constructor);
    });

    test('Maybe and Perhaps have different prototypes.', () => {
      expect(Perhaps.prototype).not.toEqual(Maybe.prototype);
    });

    describe('equals', () => {
      const something = Perhaps.Something(42);
      test('should equal when the value is the same', () => {
        expect(something).toSatisfy(unionEquals(Perhaps.Something(42)));
      });

      test('should not be equal when the value is the different', () => {
        expect(something).not.toSatisfy(unionEquals(Perhaps.Something(3)));
      });

      test('should not be equal when the tag is different', () => {
        expect(something).not.toSatisfy(unionEquals(Perhaps.None()));
      });
    });
  });

  describe('matchWith', () => {
    const cases = {
      Just: val => val,
      Nothing: () => 'default',
    };

    test('works on a Just value', () => {
      expect(matchWith(Maybe.Just('Hello'), cases)).toEqual('Hello');
    });

    test('works on a Nothing value', () => {
      expect(matchWith(Maybe.Nothing(), cases)).toEqual('default');
    });
  });
});

describe('Maybe', () => {
  test('is Just in the minimum default context', () => {
    expect(Maybe.of(3)).toSatisfy(unionEquals(Maybe.Just(3)));
  });

  describe('Just', () => {
    test('creates a Just value', () => {
      const maybe = Maybe.Just(42);
      expect(maybe).toEqual(expect.objectContaining({
        _ctor: 'Just',
        _args: [42],
      }));
    });
  });

  describe('Nothing', () => {
    test('creates a Nothing value', () => {
      const maybe = Maybe.Nothing();
      expect(maybe).toEqual(expect.objectContaining({
        _ctor: 'Nothing',
        _args: [],
      }));
    });
  });

  describe('map', () => {
    const double = R.multiply(2);
    test("maps when it's just", () => {
      const maybe = Maybe.Just(10);
      expect(maybe.map(double)).toSatisfy(unionEquals(Maybe.Just(20)));
    });

    test("skips when it's nothing", () => {
      const maybe = Maybe.Nothing();
      expect(maybe.map(double)).toSatisfy(unionEquals(maybe));
    });
  });

  describe('chain', () => {
    const listHead = list =>
      list.length === 0 ? Maybe.Nothing() : Maybe.Just(list[0]);
    test('maps and flattens', () => {
      const maybe = Maybe.Just([1, 2]);
      expect(maybe.chain(listHead)).toSatisfy(unionEquals(Maybe.Just(1)));
    });

    test("skips when it's nothing", () => {
      const maybe = Maybe.Nothing();
      expect(maybe.chain(listHead)).toSatisfy(unionEquals(Maybe.Nothing()));
    });
  });

  describe('ap', () => {
    test('applies the argument to a function', () => {
      const add = a => b => a + b;
      const maybeFn = Maybe.Just(add);
      expect(maybeFn.ap(Maybe.Just(3)).ap(Maybe.Just(2))).toSatisfy(
        unionEquals(Maybe.Just(5))
      );
    });

    test('does nothing if function is Nothing', () => {
      const add = a => b => a + b;
      const maybeFn = Maybe.Nothing();
      expect(maybeFn.ap(Maybe.Just(3)).ap(Maybe.Just(2))).toSatisfy(
        unionEquals(Maybe.Nothing())
      );
    });

    test('does nothing if value is Nothing', () => {
      const add = a => b => a + b;
      const maybeFn = Maybe.Just(add);
      expect(maybeFn.ap(Maybe.Nothing())).toSatisfy(
        unionEquals(Maybe.Nothing())
      );
    });
  });
});

describe('Result', () => {
  const cases = {
    Err: err => err,
    Ok: val => val,
  };

  test('matches Err', () => {
    const result = Result.Err('I am err');
    expect(matchWith(result, cases)).toEqual('I am err');
  });

  test('matches Ok', () => {
    const result = Result.Ok('I am ok');
    expect(matchWith(result, cases)).toEqual('I am ok');
  });

  test('is Ok in the minimum default context', () => {
    expect(Result.of(3)).toSatisfy(unionEquals(Result.Ok(3)));
  });

  describe('.map', () => {
    const double = val => 2 * val;
    test("maps when it's Ok", () => {
      expect(Result.Ok(3).map(double)).toSatisfy(unionEquals(Result.Ok(6)));
    });

    test("skips when it's Err", () => {
      expect(Result.Err('Oh no').map(double)).toSatisfy(
        unionEquals(Result.Err('Oh no'))
      );
    });
  });

  describe('.mapError', () => {
    const toUpper = str => str.toUpperCase();
    test("skips when it's Ok", () => {
      expect(Result.Ok(3).mapError(toUpper)).toSatisfy(
        unionEquals(Result.Ok(3))
      );
    });

    test("maps the error when it's Err", () => {
      expect(Result.Err('Oh no').mapError(toUpper)).toSatisfy(
        unionEquals(Result.Err('OH NO'))
      );
    });
  });

  describe('.chain', () => {
    const safeJsonParse = val => {
      try {
        return Result.Ok(JSON.parse(val));
      } catch (e) {
        return Result.Err(e);
      }
    };
    test("maps and flattens when it's Ok", () => {
      expect(Result.Ok('{ "a": 3 }').chain(safeJsonParse)).toSatisfy(
        unionEquals(Result.Ok({a: 3}))
      );
    });

    test("skips when it's Err", () => {
      expect(Result.Err('Oh no').chain(safeJsonParse)).toSatisfy(
        unionEquals(Result.Err('Oh no'))
      );
    });
  });

  describe('.ap', () => {
    test('applies the argument to a function', () => {
      const add = a => b => a + b;
      const resultFn = Result.Ok(add);
      expect(resultFn.ap(Result.Ok(3)).ap(Result.Ok(2))).toSatisfy(
        unionEquals(Result.Ok(5))
      );
    });

    test('does nothing if function is Err', () => {
      const add = a => b => a + b;
      const resultFn = Result.Err('Oh no');
      expect(resultFn.ap(Result.Ok(3)).ap(Result.Ok(2))).toSatisfy(
        unionEquals(Result.Err('Oh no'))
      );
    });

    test('does nothing if value is Err', () => {
      const add = a => b => a + b;
      const resultFn = Result.Ok(add);
      expect(resultFn.ap(Result.Err('Oh no'))).toSatisfy(
        unionEquals(Result.Err('Oh no'))
      );
    });
  });
});

describe('Task', () => {
  describe('.succeed', () => {
    test('creates a successful task', () => {
      const task = Task.succeed(3);
      return expect(task.run()).resolves.toBe(3);
    });
  });

  describe('.failed', () => {
    test('creates a failed task', () => {
      const task = Task.fail('OMG');
      return expect(task.run()).rejects.toBe('OMG');
    });
  });

  describe('.all', () => {
    test('batches tasks', () => {
      const task = Task.all([Task.succeed(3), Task.succeed(5)]);
      return expect(task.run()).resolves.toEqual([3, 5]);
    });

    test('fails if one of them fails', () => {
      const task = Task.all([Task.succeed(3), Task.fail('Oh no')]);
      return expect(task.run()).rejects.toBe('Oh no');
    });

    test('can be mapped like any task', () => {
      const sum = ([a, b]) => a + b;
      const task = Task.all([Task.succeed(3), Task.succeed(5)]).map(sum);
      return expect(task.run()).resolves.toBe(8);
    });
  });

  describe('.sequence', () => {
    test('executes tasks in sequence', () => {
      const task = Task.sequence([Task.succeed(3), Task.succeed(5)]);
      return expect(task.run()).resolves.toEqual([3, 5]);
    });

    test('executes tasks in order from left to right', () => {
      const delayTask = Task.of(
        () => new Promise(resolve => setTimeout(resolve, 500))
      ).map(_ => 3);

      const task = Task.sequence([delayTask, Task.succeed(5)]);
      return expect(task.run()).resolves.toEqual([3, 5]);
    });

    test('fails if one of them fails', () => {
      const task = Task.sequence([Task.succeed(3), Task.fail('Oh no')]);
      return expect(task.run()).rejects.toBe('Oh no');
    });
  });

  describe('.prototype', () => {
    describe('.map', () => {
      test('maps when successful', () => {
        const double = a => a * 2;
        const task = Task.succeed(42).map(double);
        return expect(task.run()).resolves.toBe(84);
      });
    });

    describe('.map2', () => {
      test('maps when successful', () => {
        const add = (a, b) => a + b;
        const task = Task.succeed(42).map2(add, Task.succeed(3));
        return expect(task.run()).resolves.toBe(45);
      });

      test('fails when one of them fails', () => {
        const add = (a, b) => a + b;
        const task = Task.succeed(42).map2(add, Task.fail('Oh no'));
        return expect(task.run()).rejects.toBe('Oh no');
      });
    });

    describe('.mapError', () => {
      test('maps the error when failed', () => {
        const toLower = str => str.toLowerCase();
        const task = Task.fail('OH NO').mapError(toLower);
        return expect(task.run()).rejects.toBe('oh no');
      });
    });

    describe('.chain', () => {
      test('maps and flattens when successful', () => {
        const task = Task.succeed('Hello');
        const toConcatTask = val => Task.of(() => val.concat('!!!'));
        const chainedTask = task.chain(toConcatTask);
        return expect(chainedTask.run()).resolves.toBe('Hello!!!');
      });
    });

    describe('.onError', () => {
      test('catches and flattens when failed', () => {
        const toConcatTask = val => Task.of(() => val.concat('!!!'));
        const task = Task.fail('Oh no').onError(toConcatTask);
        return expect(task.run()).resolves.toBe('Oh no!!!');
      });
    });
  });
});
