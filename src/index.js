// @flow
import {readFile} from './parse'
import type {Type, Property} from './types'
import * as validate from './validate'

export default {readFile, validate}
export type {Type, Property};
