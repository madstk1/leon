#!/usr/bin/env python
# -*- coding:utf-8 -*-

import json
import utils
from requests import Request, Session

def power_on(string, entities):
    """Power on device, via Home Assistant"""

    device = ''

    if not utils.config('apikey'):
        return utils.output('end', 'key_not_provided', utils.translate('key_not_provided'))

    for item in entities:
        if item['entity'] == 'device':
            device = item['sourceText']

    if not device:
        return utils.output('end', 'device_not_provided', utils.translate('device_not_provided'))

    res = postDataToHass({ "action": "turn on", "device": device })
    if not res == 200:
        return utils.output('end', 'connection_failed', utils.translate('connection_failed', { 'code': res }))

    return utils.output('end', 'turned_on_device', utils.translate('turned_on_device', { 'device': device }))

def power_off(string, entities):
    """Power off device, via Home Assistant"""

    device = ''

    if not utils.config('apikey'):
        return utils.output('end', 'key_not_provided', utils.translate('key_not_provided'))

    for item in entities:
        if item['entity'] == 'device':
            device = item['sourceText']

    if not device:
        return utils.output('end', 'device_not_provided', utils.translate('device_not_provided'))

    res = postDataToHass({ "action": "turn off", "device": device })
    if not res == 200:
        return utils.output('end', 'connection_failed', utils.translate('connection_failed', { 'code': res }))

    return utils.output('end', 'turned_off_device', utils.translate('turned_off_device', { 'device': device }))

def postDataToHass(payload):
    """Post data payload to Home Assistant"""

    # Python Requests require protocol, so we default to HTTP
    hostname = utils.config('hostname')
    if '://' not in hostname:
        hostname = 'http://' + hostname

    raw = json.dumps(payload)

    s = Session()
    req = Request(
        'POST',
        '{}:{}/api/events/script_started'.format(hostname, utils.config('port')),
        data = raw,
        headers = {
            'Authorization': 'Bearer {}'.format(utils.config('apikey')),
            'Content-Type': 'application/json'
        }
    )
    prepped = req.prepare()
    resp = s.send(prepped)

    return resp.status_code

def checkHassConnection():
    """Check connection to Home Assistant"""

    r = utils.http('GET', '{}:{}'.format(utils.config('hostname'), utils.config('port')))
    return r.status_code
