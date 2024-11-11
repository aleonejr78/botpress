export type ValueOf<T> = T[keyof T]
export type Merge<A extends object, B extends object> = Omit<A, keyof B> & B
export type Cast<T, U> = T extends U ? T : U
export type SafeCast<T, U> = [T] extends [never] ? U : Cast<T, U>
export type Writable<T> = { -readonly [K in keyof T]: T[K] }
export type Default<T, U> = undefined extends T ? U : T

export type IsExtend<X, Y> = X extends Y ? true : false
export type IsEquivalent<X, Y> = IsExtend<X, Y> extends true ? IsExtend<Y, X> : false
export type IsIdentical<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y ? 1 : 2 ? true : false
export type IsEqual<X, Y> = IsIdentical<Normalize<X>, Normalize<Y>>

export type AssertExtends<_A extends B, B> = true
export type AssertTrue<_T extends true> = true
export type AssertAll<_T extends true[]> = true

export type Join<S extends (string | number | symbol)[]> = S extends [infer H, ...infer T]
  ? `${Cast<H, string>}${Join<Cast<T, string[]>>}`
  : S extends [infer H]
  ? Cast<H, string>
  : ''

export type Split<S extends string | number | symbol, D extends string> = S extends `${infer H}${D}${infer T}`
  ? [H, ...Split<Cast<T, string>, D>]
  : [S]

export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never

/**
 * removes string index signature from Record
 */
export type ToSealedRecord<R extends Record<string, any>> = {
  [K in keyof R as string extends K ? never : K]: R[K]
}

export type Normalize<T> = T extends (...args: infer A) => infer R
  ? (...args: Normalize<A>) => Normalize<R>
  : T extends Promise<infer R>
  ? Promise<Normalize<R>>
  : T extends Buffer
  ? Buffer
  : T extends object
  ? T extends infer O
    ? { [K in keyof O]: Normalize<O[K]> }
    : never
  : T