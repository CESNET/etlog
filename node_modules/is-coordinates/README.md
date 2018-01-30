# is-coordinates [![Build Status](https://travis-ci.org/Zertz/is-coordinates.svg?branch=master)](https://travis-ci.org/Zertz/is-coordinates) [![npm version](https://badge.fury.io/js/is-coordinates.svg)](https://badge.fury.io/js/is-coordinates)

> Determines if an array contains a valid set of numbers for representing latitude and longitude coordinates


## Install

```
$ npm install --save is-coordinates
```


## Usage

```js
const isCoordinates = require('is-coordinates')

isCoordinates([45.266486, -72.147989])
// yep

isCoordinates('unicorns')
// nope
```


## API

### isCoordinates(input, [options])

#### input

Type: `array`

Coordinates.

#### options

##### validate

Type: `boolean`<br>
Default: `false`

Validate range (-180/180, -90/90)


## License

MIT © 2016 [Pier-Luc Gendreau](https://github.com/Zertz)
