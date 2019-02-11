// @flow
// https://github.com/estree/estree/blob/master/spec.md

import {parse} from '@babel/parser';
import {assign, curry} from 'lodash';
import {readFileSync} from 'fs';
import * as t from '@babel/types'

import type {Type, Property, ObjectMap} from './types';


//////////////////////////////////////////////////////////////
// fileTypes


// read a file synchronously and return a type definition for each type alias found
// keys are the name of the alias
// values are the type description
// you should run this when your program starts

export function readFile(filepath:string):ObjectMap<Type> {
  return findTypes(parseFile(filepath))
}

function parseFile(filepath:string): BabelNodeFile {
  let data = readFileSync(filepath).toString()
  return parse(data, {
    allowImportExportEverywhere: true,
    sourceType: "module",
    plugins: [
      "flow"
    ]
  });
}

function findTypes(file:BabelNodeFile): ObjectMap<Type> {
  console.log("DATA", file)

  const aliases:Array<?BabelNodeTypeAlias> = file.program.body.map(function(s: BabelNodeStatement) {
    let ex: any = s;
    if (t.isExportNamedDeclaration(s) || t.isExportDefaultDeclaration(s)) {
      // $FlowIgnore
      ex = ex.declaration
    }

    if (t.isTypeAlias(ex)) {
      return ex;
    }
  })

  return aliases.reduce(function(values, alias:?BabelNodeTypeAlias) {
    if (alias) {
      values[alias.id.name] = toType(alias.right)
    }
    return values
  }, {})
}

function toProperty(prop: BabelNodeObjectTypeProperty): Property {
  console.log(prop);
  const p:Object = {
    key: prop.key.name,
    type: toType(prop.value),
  }

  if (prop.optional) {
    p.optional = true
  }

  return p
}

function toType(anno: BabelNodeFlowType):Type {

  if (t.isObjectTypeAnnotation(anno)) {
    return objectType((anno : any))
  }

  else if (t.isGenericTypeAnnotation(anno)) {
    return genericType((anno : any))
  }

  else if (t.isNullableTypeAnnotation(anno)) {
    return nullableType((anno : any))
  }

  else if (t.isStringLiteralTypeAnnotation(anno)) {
    return literalType((anno : any))
  }

  else {
    return valueType(anno)
  }
}

//GenericTypeAnnotation
function genericType(anno: BabelNodeGenericTypeAnnotation):Type {
  var type = (emptyType(anno.id.name) : any)

  if (anno.typeParameters) {
    type.params = anno.typeParameters.params.map(toType)
  }

  return type
}

function objectType(anno:BabelNodeObjectTypeAnnotation):Type {
  var type = (emptyType('Object') : any)
  type.properties = anno.properties.map(toProperty)
  return type
}

function nullableType(anno:BabelNodeNullableTypeAnnotation):Type {
  var type = toType(anno.typeAnnotation)
  type.nullable = true
  return type
}

function literalType(anno:BabelNodeStringLiteralTypeAnnotation):Type {
  var type = valueType(anno)
  type.literal = anno.value
  return type
}

//VoidTypeAnnotation
//StringTypeAnnotation
//BooleanTypeAnnotation
//NumberTypeAnnotation
//FunctionTypeAnnotation
//StringLiteralTypeAnnotation
//AnyTypeAnnotation

// UNSUPPORTED
//ArrayTypeAnnotation (it uses GenericTypeAnnotation)
//IntersectionTypeAnnotation
//UnionTypeAnnotation
//TupleTypeAnnotation
//TypeAnnotation
//TypeofTypeAnnotation

function valueType(anno:BabelNodeFlowType):Type {
  var type = emptyType(shortName(anno))
  return (type : any)
}

function emptyType(name:string):Type {
  return {
    name: name,
  }
}

function shortName(anno:BabelNodeFlowType):string {

  if (t.isStringTypeAnnotation(anno)) {
    return 'string'
  }

  else if (t.isNumberTypeAnnotation(anno)) {
    return 'number'
  }

  else if (t.isBooleanTypeAnnotation(anno)) {
    return 'boolean'
  }

  else if (t.isAnyTypeAnnotation(anno)) {
    return 'any'
  }

  return anno.type.replace('TypeAnnotation', '')
}
