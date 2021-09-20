# Home Assistant Package

The Home Assistant package contains modules that can interface with a Home Assistant installation.

## Modules

### Power on/off devices

#### Usage

```
(en-US) "Turn off TV"
(en-US) "Power on ceiling fan"
(en-US) "Turn on vacuum"
```

#### Example blueprint

You can use the following blueprint, to handle events.
With this, you can create new automations for each device.

```
blueprint:
  name: Leon - Power events
  description: Handle power events from Leon's Hass module
  domain: automation
  input:
    event_device:
      name: Target device
      selector:
        entity:
    data_selector:
      name: Data selector
      selector:
        text:

variables:
  selector: !input data_selector

trigger:
  platform: event
  event_type: script_started

action:
  - service: >
      {% if trigger.event.data.device == selector %}
        {% if trigger.event.data.action == "turn on" %}
          homeassistant.turn_on
        {% else %}
          homeassistant.turn_off
        {% endif %}
      {% endif %}
    target:
      entity_id: !input event_device
```
