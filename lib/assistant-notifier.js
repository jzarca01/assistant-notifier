const googlehome = require('google-home-notifier');
const Watson = require('node-watson-tts')

const ip = require('ip');
const path = require('path').resolve(__dirname, 'public', 'result.mp3')
const file = require('fs').createWriteStream(path);
const express = require('express')
const app = express()

const PORT = 3615

app.use('/public', express.static(__dirname + '/public'));

class AssistantNotifier {
  constructor({
    apiKey,
    host
  }) {
    this.apiKey = apiKey
    this.host = host
    googlehome.ip(this.host, 'fr')
    this.watson = new Watson({
      apiKey: this.apiKey
    })
  }

  init(plugins) {
    this.plugins = plugins;
    if (!this.apiKey || !this.host) {
      return Promise.reject(
        '[assistant-notifier-watson] Erreur : vous devez configurer ce plugin !'
      );
    }
    return Promise.resolve(this);
  }

  async notify(text) {
    try {
      const audio = await this.watson.generateAudio(text)
      audio.pipe(file)
      const server = app.listen(PORT)
      googlehome.play(`http://${ip.address()}:${PORT}/public/result.mp3`, () => server.close())
    } catch (err) {
      console.log('error with notify', err)
    }
  }

  async play(url) {
    return googlehome.play(url, () => console.log('Playing url ', url))
  }

  async action(commande) {
    if (commande.toLowerCase().startsWith("http")) {
      return this.play(commande)
    }
    return await this.notify(commande);
  }
}

exports.init = (configuration, plugins) => {
  return new AssistantNotifier(configuration).init(plugins).then(resource => {
    console.log('[assistant-notifier-watson] Plugin chargé et prêt.');
    return resource;
  });
};