import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const schema = z.object({

  fullName:
    z.string().min(2),

  email:
    z.string().email(),

  phone:
    z.string().min(5),

  businessType:
    z.string(),

  challenges:
    z.string(),

  token:
    z.string()
})

export default async function handler(
  req,
  res
) {

  try {

    // ONLY POST

    if (req.method !== 'POST') {

      return res.status(405).json({
        error: 'Method not allowed'
      })
    }

    // SAFE BODY PARSE

    const body =
      typeof req.body === 'string'
        ? JSON.parse(req.body)
        : req.body

    // VALIDATE

    const parsed =
      schema.safeParse(body)

    if (!parsed.success) {

      return res.status(400).json({
        error: 'Invalid form data'
      })
    }

    // VERIFY TURNSTILE

    const captchaResponse =
      await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({

            secret:
              process.env
                .TURNSTILE_SECRET_KEY,

            response:
              body.token
          })
        }
      )

    const captchaData =
      await captchaResponse.json()

    if (!captchaData.success) {

      return res.status(400).json({
        error:
          'Captcha verification failed'
      })
    }

    // SAVE TO DATABASE

    const { error } =
      await supabase
        .from('leads')
        .insert([
          {
            full_name:
              body.fullName,

            email:
              body.email,

            phone:
              body.phone,

            business_type:
              body.businessType,

            challenges:
              body.challenges
          }
        ])

    if (error) {

      console.error(error)

      return res.status(500).json({
        error:
          error.message
      })
    }

    // SUCCESS

    return res.status(200).json({

      success: true,

      message:
        'Lead submitted successfully'
    })

  } catch (error) {

    console.error(error)

    return res.status(500).json({

      error:
        error.message
    })
  }
}