/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Target Language - Language used by Translate Selection */
  "targetLanguage": string,
  /** Grok CLI Path - Optional path to the grok binary. Leave empty to auto-detect */
  "grokPath"?: string,
  /** Model - Optional model id passed to grok --model */
  "model"?: string,
  /** Translation Instructions - Optional extra guidance for translation, such as tone or terms to keep */
  "translateInstructions"?: string,
  /** English Instructions - Optional extra guidance for Improve English */
  "improveInstructions"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `translate-selection` command */
  export type TranslateSelection = ExtensionPreferences & {}
  /** Preferences accessible in the `improve-english` command */
  export type ImproveEnglish = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `translate-selection` command */
  export type TranslateSelection = {}
  /** Arguments passed to the `improve-english` command */
  export type ImproveEnglish = {}
}

