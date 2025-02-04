import dotenv from 'dotenv'
import fs from 'fs'
import { command } from 'execa'
import semver from 'semver'

import log from '@/helpers/log'

dotenv.config()

/**
 * Checking script
 * Help to figure out what is installed or not
 */
export default () => new Promise(async (resolve, reject) => {
  try {
    const nodeMinRequiredVersion = '10'
    const npmMinRequiredVersion = '5'
    const pythonMinRequiredVersion = '3'
    const envPath = '.env'
    const envLangValues = ['en-US', 'fr-FR']
    const envEnvValues = ['development', 'testing', 'production']
    const envSttProviderValues = ['deepspeech', 'google-cloud-stt', 'watson-stt']
    const envTtsProviderValues = ['flite', 'mimic', 'amazon-polly', 'google-cloud-tts', 'watson-tts']
    const flitePath = 'bin/flite/flite'
    const mimicPath = 'bin/mimic-v1'
    const deepSpeechPath = 'bin/deepspeech/lm.binary'
    const amazonPath = 'server/src/config/voice/amazon.json'
    const googleCloudPath = 'server/src/config/voice/google-cloud.json'
    const watsonSttPath = 'server/src/config/voice/watson-stt.json'
    const watsonTtsPath = 'server/src/config/voice/watson-tts.json'
    const nlpModelPath = 'server/src/data/leon-model.nlp'
    const report = {
      can_run: { title: 'Run', type: 'error', v: true },
      can_run_module: { title: 'Run modules', type: 'error', v: true },
      can_text: { title: 'Reply you by texting', type: 'error', v: true },
      can_amazon_polly_tts: { title: 'Amazon Polly text-to-speech', type: 'warning', v: true },
      can_google_cloud_tts: { title: 'Google Cloud text-to-speech', type: 'warning', v: true },
      can_watson_tts: { title: 'Watson text-to-speech', type: 'warning', v: true },
      can_offline_flite: { title: 'Flite text-to-speech', type: 'warning', v: true },
      can_offline_mimic: { title: 'Mimic text-to-speech', type: 'warning', v: true },
      can_google_cloud_stt: { title: 'Google Cloud speech-to-text', type: 'warning', v: true },
      can_watson_stt: { title: 'Watson speech-to-text', type: 'warning', v: true },
      can_offline_stt: { title: 'Offline speech-to-text', type: 'warning', v: true }
    }

    log.title('Checking')

    // .env checking
    // Currently, missing validation for:
    // - PIPENV_PIPFILE
    // - PIPENV_VENV_IN_PROJECT
    // - LEON_TIME_ZONE
    // - LEON_HOST

    log.info('.env validity')
    if (!fs.existsSync(envPath)) {
      report.can_run.v = false
      log.error('.env file not found or broken\n')
    } else {
      const env = {
        lang: process.env.LEON_LANG,
        node_env: process.env.LEON_NODE_ENV,
        host: process.env.LEON_HOST,
        port: process.env.LEON_PORT,
        after_speech: process.env.LEON_AFTER_SPEECH,
        stt: process.env.LEON_STT,
        stt_prov: process.env.LEON_STT_PROVIDER,
        tts: process.env.LEON_TTS,
        tts_prov: process.env.LEON_TTS_PROVIDER,
        logger: process.env.LEON_LOGGER
      }

      if (env.lang && envLangValues.indexOf(env.lang) === -1) {
        log.error(`LEON_LANG is not a valid value: ${env.lang}, valid values are ${envLangValues}\n`)
        report.can_run.v = false
      } else if (env.node_env && envEnvValues.indexOf(env.node_env) === -1) {
        log.error(`LEON_NODE_ENV is not a valid value: ${env.node_env}, valid values are ${envEnvValues}\n`)
        report.can_run.v = false
      } else if (typeof env.port === 'number') {
        log.error(`LEON_PORT is not a valid value: ${env.port}, must be a number\n`)
        report.can_run.v = false
      } else if (typeof env.after_speech === 'boolean') {
        log.error(`LEON_AFTER_SPEECH is not a valid value: ${env.after_speech}, must be a boolean\n`)
        report.can_run.v = false
      } else if (typeof env.stt === 'boolean') {
        log.error(`LEON_STT is not a valid value: ${env.stt}, must be a boolean\n`)
        report.can_run.v = false
      } else if (env.stt_provider && envSttProviderValues.indexOf(env.stt_provider) === -1) {
        log.error(`LEON_STT_PROVIDER is not a valid value: ${env.stt_provider},
                   valid values are ${envSttProviderValues}\n`)
        report.can_run.v = false
      } else if (typeof env.tts === 'boolean') {
        log.error(`LEON_STT is not a valid value: ${env.stt}, must be a boolean\n`)
        report.can_run.v = false
      } else if (env.tts_provide && envTtsProviderValues.indexOf(env.tts_provider) === -1) {
        log.error(`LEON_TTS_PROVIDER is not a valid value: ${env.tts_provider},
                   valid values are ${envTtsProviderValues}\n`)
        report.can_run.v = false
      } else if (typeof env.logger === 'boolean') {
        log.error(`LEON_LOGGER is not a valid value: ${env.logger}, must be a boolean\n`)
        report.can_run.v = false
      } else {
        log.success('Found and valid\n')
        report.can_run.v = true
      }
    }

    // Environment checking

    (await Promise.all([
      command('node --version', { shell: true }),
      command('npm --version', { shell: true }),
      command('pipenv --version', { shell: true })
    ])).forEach((p) => {
      log.info(p.command)

      if (p.command.indexOf('node --version') !== -1
        && !semver.satisfies(semver.clean(p.stdout), `>=${nodeMinRequiredVersion}`)) {
        Object.keys(report).forEach((item) => { if (report[item].type === 'error') report[item].v = false })
        log.error(`${p.stdout}\nThe Node.js version must be >=${nodeMinRequiredVersion}. Please install it: https://nodejs.org (or use nvm)\n`)
      } else if (p.command.indexOf('npm --version') !== -1
        && !semver.satisfies(semver.clean(p.stdout), `>=${npmMinRequiredVersion}`)) {
        Object.keys(report).forEach((item) => { if (report[item].type === 'error') report[item].v = false })
        log.error(`${p.stdout}\nThe npm version must be >=${npmMinRequiredVersion}. Please install it: https://www.npmjs.com/get-npm (or use nvm)\n`)
      } else {
        log.success(`${p.stdout}\n`)
      }
    });

    (await Promise.all([
      command('pipenv --where', { shell: true }),
      command('pipenv run python --version', { shell: true })
    ])).forEach((p) => {
      log.info(p.command)

      if (p.command.indexOf('pipenv run python --version') !== -1
        && !semver.satisfies(p.stdout.split(' ')[1], `>=${pythonMinRequiredVersion}`)) {
        Object.keys(report).forEach((item) => { if (report[item].type === 'error') report[item].v = false })
        log.error(`${p.stdout}\nThe Python version must be >=${pythonMinRequiredVersion}. Please install it: https://www.python.org/downloads\n`)
      } else {
        log.success(`${p.stdout}\n`)
      }
    })

    // Module execution checking

    try {
      const p = await command('pipenv run python bridges/python/main.py scripts/assets/query-object.json', { shell: true })
      log.info(p.command)
      log.success(`${p.stdout}\n`)
    } catch (e) {
      log.info(e.command)
      report.can_run_module.v = false
      log.error(`${e}\n`)
    }

    // NLP model checking

    log.info('NLP model state')
    if (!fs.existsSync(nlpModelPath) || !Object.keys(fs.readFileSync(nlpModelPath)).length) {
      report.can_text.v = false
      Object.keys(report).forEach((item) => { if (item.indexOf('stt') !== -1 || item.indexOf('tts') !== -1) report[item].v = false })
      log.error('NLP model not found or broken. Try to generate a new one: "npm run train expressions"\n')
    } else {
      log.success('Found and valid\n')
    }

    // TTS checking

    log.info('Amazon Polly TTS')
    try {
      const json = JSON.parse(fs.readFileSync(amazonPath))
      if (json.accessKeyId === '' || json.secretAccessKey === '') {
        report.can_amazon_polly_tts.v = false
        log.warning('Amazon Polly TTS is not yet configured\n')
      } else {
        log.success('Configured\n')
      }
    } catch (e) {
      report.can_amazon_polly_tts.v = false
      log.warning(`Amazon Polly TTS is not yet configured: ${e}\n`)
    }

    log.info('Google Cloud TTS/STT')
    try {
      const json = JSON.parse(fs.readFileSync(googleCloudPath))
      const results = []
      Object.keys(json).forEach((item) => { if (json[item] === '') results.push(false) })
      if (results.includes(false)) {
        report.can_google_cloud_tts.v = false
        report.can_google_cloud_stt.v = false
        log.warning('Google Cloud TTS/STT is not yet configured\n')
      } else {
        log.success('Configured\n')
      }
    } catch (e) {
      report.can_google_cloud_tts.v = false
      report.can_google_cloud_stt.v = false
      log.warning(`Google Cloud TTS/STT is not yet configured: ${e}\n`)
    }

    log.info('Watson TTS')
    try {
      const json = JSON.parse(fs.readFileSync(watsonTtsPath))
      const results = []
      Object.keys(json).forEach((item) => { if (json[item] === '') results.push(false) })
      if (results.includes(false)) {
        report.can_watson_tts.v = false
        log.warning('Watson TTS is not yet configured\n')
      } else {
        log.success('Configured\n')
      }
    } catch (e) {
      report.can_watson_tts.v = false
      log.warning(`Watson TTS is not yet configured: ${e}\n`)
    }

    log.info('Flite TTS')
    if (!fs.existsSync(flitePath)) {
      report.can_offline_flite.v = false
      log.warning(`Cannot find ${flitePath}. You can setup the offline TTS by running: "npm run setup:offline-tts"\n`)
    } else {
      log.success(`Found Flite at ${flitePath}\n`)
    }

    log.info('Mimic TTS')
    if (!fs.existsSync(mimicPath)) {
      report.can_offline_mimic.v = false
      log.warning(`Cannot find ${mimicPath}. You can setup the offline TTS by running: "npm run setup:offline-tts"\n`)
    } else {
      log.success(`Found Mimic at ${mimicPath}\n`)
    }

    log.info('Watson STT')
    try {
      const json = JSON.parse(fs.readFileSync(watsonSttPath))
      const results = []
      Object.keys(json).forEach((item) => { if (json[item] === '') results.push(false) })
      if (results.includes(false)) {
        report.can_watson_stt.v = false
        log.warning('Watson STT is not yet configured\n')
      } else {
        log.success('Configured\n')
      }
    } catch (e) {
      report.can_watson_stt.v = false
      log.warning(`Watson STT is not yet configured: ${e}`)
    }

    log.info('Offline STT')
    if (!fs.existsSync(deepSpeechPath)) {
      report.can_offline_stt.v = false
      log.warning(`Cannot find ${deepSpeechPath}. You can setup the offline STT by running: "npm run setup:offline-stt"`)
    } else {
      log.success(`Found DeepSpeech language model at ${deepSpeechPath}`)
    }

    // Report
    log.title('Report')

    log.info('Here is the diagnosis about your current setup')
    Object.keys(report).forEach((item) => {
      if (report[item].v === true) {
        log.success(report[item].title)
      } else {
        log[report[item].type](report[item].title)
      }
    })

    log.default('')
    if (report.can_run.v && report.can_run_module.v && report.can_text.v) {
      log.success('Hooray! Leon can run correctly')
      log.info('If you have some yellow warnings, it is all good. It means some entities are not yet configured')
    } else {
      log.error('Please fix the errors above')
    }

    resolve()
  } catch (e) {
    log.error(e)
    reject()
  }
})
