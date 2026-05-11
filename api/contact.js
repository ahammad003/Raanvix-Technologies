import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { z } from 'zod'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

const resend = new Resend(
  process.env.RESEND_API_KEY
)

// VALIDATION

const schema = z.object({

  fullName:
    z.string().min(2),

  email:
    z.string().email(),

  phone:
    z.string().min(10),

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

  // ALLOW ONLY POST

  if (req.method !== 'POST') {

    return res.status(405).json({
      error: 'Method not allowed'
    })
  }

  try {

    const body = req.body

    // VALIDATE FORM

    const parsed =
      schema.safeParse(body)

    if (!parsed.success) {

      return res.status(400).json({
        error: 'Invalid form data'
      })
    }

    // VERIFY CAPTCHA

    const captcha =
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
      await captcha.json()

    if (!captchaData.success) {

      return res.status(400).json({
        error: 'Captcha verification failed'
      })
    }

    // SAVE LEAD TO DATABASE

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
          'Database insert failed'
      })
    }

    // SEND EMAIL

    await resend.emails.send({

      from:
        'onboarding@resend.dev',

      to:
        'raanvixtechnologies@gmail.com',

      subject:
        'New Client Lead',

      html: `

        <h2>New Client Lead</h2>

        <p>
          <strong>Name:</strong>
          ${body.fullName}
        </p>

        <p>
          <strong>Email:</strong>
          ${body.email}
        </p>

        <p>
          <strong>Phone:</strong>
          ${body.phone}
        </p>

        <p>
          <strong>Business Type:</strong>
          ${body.businessType}
        </p>

        <p>
          <strong>Challenges:</strong>
          ${body.challenges}
        </p>
      `
    })

    // SUCCESS

    return res.status(200).json({
      success: true
    })

  } catch (error) {

    console.error(error)

    return res.status(500).json({
      error: 'Server error'
    })
  }
}