const defaultParameters = {
  resources: "https://s.eu.tankionline.com",
  config_template: "https://c{server}.eu.tankionline.com/config.xml",
  balancer: "https://tankionline.com/s/status.js/",
  lang: "de",
  browser_user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
  os: "MacIntel",
  device_type: "Desktop",
  client_type: "BROWSER",
  hardware_concurrency: "8",
  time_zone: "Europe/Berlin",
  video_card: "ANGLE (Apple, ANGLE Metal Renderer: Apple M1, Unspecified Version)",
  mobile_device: "false",
  touchscreen_support: "false",
  ram_size: "8192",
};

class CL_HashRequest {
  constructor(config) {
    if (!config || Object.keys(config).length === 0) {
      config = defaultParameters;
    }

    const { resources, config_template, balancer, lang, browser_user_agent, os, device_type, client_type, hardware_concurrency, time_zone, video_card, mobile_device, touchscreen_support, ram_size } =
      config;
    this.command_id = 1;

    this.parameters = {
      resources,
      "config-template": config_template,
      balancer,
      lang,
      browser_user_agent,
      os,
      device_type,
      client_type,
      hardware_concurrency,
      time_zone,
      video_card,
      mobile_device,
      touchscreen_support,
      ram_size,
    };

    console.log(this.parameters);
  }

  parameterPair(pos, view, pair) {
    view.setUint8(pos, pair.length); // First write the number of values
    pos++;

    // Loop over each value in the pair
    for (let i = 0; i < pair.length; i++) {
      view.setUint8(pos, pair[i].length); // Write the length of the value in the pair
      pos++;

      // Loop over each character in the value and write the ASCII value of the character
      for (let x = 0; x < pair[i].length; x++) {
        view.setUint8(pos, pair[i].charCodeAt(x));
        pos++;
      }
    }
    return pos;
  }

  serialize() {
    const keys = Object.keys(this.parameters);
    const values = Object.values(this.parameters);
    const keyLength = keys.reduce((sum, value) => sum + value.length, 0);
    const valueLength = values.reduce((sum, value) => sum + value.length, 0);

    const buffer_length = 6 + keys.length * 2 + keyLength + valueLength;

    const buffer = new ArrayBuffer(buffer_length);
    const view = new DataView(buffer);

    let pos = 0;

    view.setUint16(pos, buffer_length - 2); // Write the packet size
    pos += 2; // Shift position by 2 bytes since the packet size is a short
    view.setUint8(pos, 0); // Nullmap byte
    pos++;
    view.setUint8(pos, this.command_id); // Command ID
    pos++;

    // Write the parameter keys and values
    // The first function is passed into the second as position value to prevent it from overwriting data due to using an outdated position
    this.parameterPair(this.parameterPair(pos, view, keys), view, values);

    return buffer;
  }
}

export default CL_HashRequest;
