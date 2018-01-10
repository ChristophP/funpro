const R = require('ramda');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
chai.use(chaiAsPromised);

const { union, matchWith, Maybe, Result, Task } = require('./index');

const unionEquals = val1 => val2 => val1.equals(val2);

describe('union', () => {
  const Perhaps = union({
    Something: 1,
    None: 0,
  });

  describe('create', () => {
    it('a Something has the correct tag.', () => {
      expect(Perhaps.Something(42)).to.include({
        __ctor: 'Something',
      });
    });

    it('matches a Something with a value.', () => {
      const perhaps = Perhaps.Something(42);
      const matched = matchWith(perhaps, {
        Something: val => val,
        None: Function.prototype,
      });
      expect(matched).to.equal(42);
    });

    it('a None has the correct tag.', () => {
      expect(Perhaps.None()).to.include({
        __ctor: 'None',
      });
    });

    it('matches a None without any values.', () => {
      const perhaps = Perhaps.None();
      const matched = matchWith(perhaps, {
        Something: Function.prototype,
        None: () => 'I am none',
      });
      expect(matched).to.equal('I am none');
    });

    it('throws when matching a non-union type.', () => {
      const badFn = () => matchWith('not a union', {});
      expect(badFn).to.throw();
    });

    it('creates curried constructors', () => {
      const Point = union({ Point: 2 });
      const Color = union({ RGB: 3 });
      const Bool = union({ True: 0, False: 0 });
      expect(Color.RGB(255, 0, 0)).to.satisfy(
        unionEquals(Color.RGB(255)(0)(0)),
      );
      expect(Point.Point(1, 0)).to.satisfy(unionEquals(Point.Point(1)(0)));
      expect(Bool.True()).to.satisfy(unionEquals(Bool.True()));
    });
  });

  describe('prototype', () => {
    it('Something and None have the same constructor.', () => {
      const none = Perhaps.None();
      const something = Perhaps.Something(42);
      expect(none.constructor).to.equal(something.constructor);
    });

    it('Maybe and Perhaps have different prototypes.', () => {
      expect(Perhaps.prototype).not.to.equal(Maybe.prototype);
    });

    describe('equals', () => {
      const something = Perhaps.Something(42);
      it('should equal when the value is the same', () => {
        expect(something).to.satisfy(unionEquals(Perhaps.Something(42)));
      });

      it('should not be equal when the value is the different', () => {
        expect(something).not.to.satisfy(unionEquals(Perhaps.Something(3)));
      });

      it('should not be equal when the tag is the different', () => {
        expect(something).not.to.satisfy(unionEquals(Perhaps.None()));
      });
    });
  });

  describe('matchWith', () => {
    const cases = {
      Just: val => val,
      Nothing: () => 'default',
    };

    it('works on a Just value', () => {
      expect(matchWith(Maybe.Just('Hello'), cases)).to.equal('Hello');
    });

    it('works on a Nothing value', () => {
      expect(matchWith(Maybe.Nothing(), cases)).to.equal('default');
    });
  });
});

describe('Maybe', () => {
  it('is Just in the minimum default context', () => {
    expect(Maybe.of(3)).to.satisfy(unionEquals(Maybe.Just(3)));
  });

  describe('Just', () => {
    it('creates a Just value', () => {
      const maybe = Maybe.Just(42);
      expect(maybe).to.deep.include({
        __ctor: 'Just',
        __args: [42],
      });
    });
  });

  describe('Nothing', () => {
    it('creates a Nothing value', () => {
      const maybe = Maybe.Nothing();
      expect(maybe).to.deep.include({
        __ctor: 'Nothing',
        __args: [],
      });
    });
  });

  describe('map', () => {
    const double = R.multiply(2);
    it("maps when it's just", () => {
      const maybe = Maybe.Just(10);
      expect(maybe.map(double)).to.satisfy(unionEquals(Maybe.Just(20)));
    });

    it("skips when it's nothing", () => {
      const maybe = Maybe.Nothing();
      expect(maybe.map(double)).to.satisfy(unionEquals(maybe));
    });
  });

  describe('chain', () => {
    const listHead = list =>
      list.length === 0 ? Maybe.Nothing() : Maybe.Just(list[0]);
    it('maps and flattens', () => {
      const maybe = Maybe.Just([1, 2]);
      expect(maybe.chain(listHead)).to.satisfy(unionEquals(Maybe.Just(1)));
    });

    it("skips when it's nothing", () => {
      const maybe = Maybe.Nothing();
      expect(maybe.chain(listHead)).to.satisfy(unionEquals(Maybe.Nothing())).to;
    });
  });
});

describe('Result', () => {
  const cases = {
    Err: err => err,
    Ok: val => val,
  };

  it('matches Err', () => {
    const result = Result.Err('I am err');
    expect(matchWith(result, cases)).to.equal('I am err');
  });

  it('matches Ok', () => {
    const result = Result.Ok('I am ok');
    expect(matchWith(result, cases)).to.equal('I am ok');
  });

  it('is Ok in the minimum default context', () => {
    expect(Result.of(3)).to.satisfy(unionEquals(Result.Ok(3)));
  });

  describe('.map', () => {
    const double = val => 2 * val;
    it("maps when it's Ok", () => {
      expect(Result.Ok(3).map(double)).to.satisfy(unionEquals(Result.Ok(6)));
    });

    it("skips when it's Err", () => {
      expect(Result.Err('Oh no').map(double)).to.satisfy(
        unionEquals(Result.Err('Oh no')),
      );
    });
  });

  describe('.mapError', () => {
    const toUpper = str => str.toUpperCase();
    it("skips when it's Ok", () => {
      expect(Result.Ok(3).mapError(toUpper)).to.satisfy(
        unionEquals(Result.Ok(3)),
      );
    });

    it("maps the error when it's Err", () => {
      expect(Result.Err('Oh no').mapError(toUpper)).to.satisfy(
        unionEquals(Result.Err('OH NO')),
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
    it("maps and flattens when it's Ok", () => {
      expect(Result.Ok('{ "a": 3 }').chain(safeJsonParse)).to.satisfy(
        unionEquals(Result.Ok({ a: 3 })),
      );
    });

    it("skips when it's Err", () => {
      expect(Result.Err('Oh no').chain(safeJsonParse)).to.satisfy(
        unionEquals(Result.Err('Oh no')),
      );
    });
  });
});

describe('Task', () => {
  describe('.succeed', () => {
    it('creates a successful task', () => {
      const task = Task.succeed(3);
      return expect(task.run()).to.eventually.equal(3);
    });
  });

  describe('.failed', () => {
    it('creates a failed task', () => {
      const task = Task.fail('OMG');
      return expect(task.run()).to.be.rejectedWith('OMG');
    });
  });

  describe('.all', () => {
    it('batches tasks', () => {
      const task = Task.all([Task.succeed(3), Task.succeed(5)]);
      return expect(task.run()).to.eventually.deep.equal([3, 5]);
    });

    it('fails if one of them fails', () => {
      const task = Task.all([Task.succeed(3), Task.fail('Oh no')]);
      return expect(task.run()).to.eventually.be.rejectedWith('Oh no');
    });

    it('can be mapped like any task', () => {
      const sum = ([a, b]) => a + b;
      const task = Task.all([Task.succeed(3), Task.succeed(5)]).map(sum);
      return expect(task.run()).to.eventually.equal(8);
    });
  });

  describe('.sequence', () => {
    it('executes tasks in sequence', () => {
      const task = Task.sequence([Task.succeed(3), Task.succeed(5)]);
      return expect(task.run()).to.eventually.deep.equal([3, 5]);
    });

    it('executes tasks in order from left to right', () => {
      const delayTask = Task.of(
        () => new Promise(resolve => setTimeout(resolve, 500)),
      ).map(_ => 3);

      const task = Task.sequence([delayTask, Task.succeed(5)]);
      return expect(task.run()).to.eventually.deep.equal([3, 5]);
    });

    it('fails if one of them fails', () => {
      const task = Task.sequence([Task.succeed(3), Task.fail('Oh no')]);
      return expect(task.run()).to.eventually.be.rejectedWith('Oh no');
    });
  });

  describe('.prototype', () => {
    describe('.map', () => {
      it('maps when successful', () => {
        const double = a => a * 2;
        const task = Task.succeed(42).map(double);
        return expect(task.run()).to.eventually.equal(84);
      });
    });

    describe('.map2', () => {
      it('maps when successful', () => {
        const add = (a, b) => a + b;
        const task = Task.succeed(42).map2(add, Task.succeed(3));
        return expect(task.run()).to.eventually.equal(45);
      });

      it('fails when one of them fails', () => {
        const add = (a, b) => a + b;
        const task = Task.succeed(42).map2(add, Task.fail('Oh no'));
        return expect(task.run()).to.eventually.be.rejectedWith('Oh no');
      });
    });

    describe('.mapError', () => {
      it('maps the error when failed', () => {
        const toLower = str => str.toLowerCase();
        const task = Task.fail('OH NO').mapError(toLower);
        return expect(task.run()).to.be.rejectedWith('oh no');
      });
    });

    describe('.chain', () => {
      it('maps and flattens when successful', () => {
        const task = Task.succeed('Hello');
        const toConcatTask = val => Task.of(() => val.concat('!!!'));
        const chainedTask = task.chain(toConcatTask);
        return expect(chainedTask.run()).to.eventually.equal('Hello!!!');
      });
    });

    describe('.onError', () => {
      it('catches and flattens when failed', () => {
        const toConcatTask = val => Task.of(() => val.concat('!!!'));
        const task = Task.fail('Oh no').onError(toConcatTask);
        return expect(task.run()).to.eventually.equal('Oh no!!!');
      });
    });
  });
});
