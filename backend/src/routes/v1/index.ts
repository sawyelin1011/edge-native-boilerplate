import { Hono } from 'hono'

import type { Bindings, Variables } from '../../index'
import { apiRoutesV1 } from './api'
import { authRoutesV1 } from './auth'
import { storageRoutesV1 } from './storage'
import { gsmflowServicesRoutesV1 } from './gsmflow/services'
import { gsmflowOrdersRoutesV1 } from './gsmflow/orders'
import { gsmflowPaymentsRoutesV1 } from './gsmflow/payments'
import { gsmflowAdminRoutesV1 } from './gsmflow/admin'

const v1 = new Hono<{ Bindings: Bindings; Variables: Variables }>()

v1.route('/auth', authRoutesV1)
v1.route('/services', gsmflowServicesRoutesV1)
v1.route('/orders', gsmflowOrdersRoutesV1)
v1.route('/payments', gsmflowPaymentsRoutesV1)
v1.route('/admin', gsmflowAdminRoutesV1)

v1.route('/storage', storageRoutesV1)

// Legacy/example routes kept for backwards compatibility
v1.route('/', apiRoutesV1)

export { v1 as v1Routes }
