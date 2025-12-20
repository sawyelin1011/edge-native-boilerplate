import { Hono } from 'hono'

import type { Bindings, Variables } from '../../index'
import { apiRoutesV1 } from './api'
import { authRoutesV1 } from './auth'
import { storageRoutesV1 } from './storage'

const v1 = new Hono<{ Bindings: Bindings; Variables: Variables }>()

v1.route('/auth', authRoutesV1)
v1.route('/storage', storageRoutesV1)
v1.route('/', apiRoutesV1)

export { v1 as v1Routes }
