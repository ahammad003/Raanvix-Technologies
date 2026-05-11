import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { z } from 'zod'

export const config = {
  api: {
    bodyParser: true
  }
}

// SUPABASE

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

// RESEND

const resend = new Resend(
  process.env.RESEND_API_KEY
)

// VALIDATION SCHEMA

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

// API HANDLER

export default async function handler(
  req,
  res
) {

  try {

    // ALLOW ONLY POST

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

    // VALIDATE FORM DATA

    const parsed =
      schema.safeParse(body)

    if (!parsed.success) {

      return res.status(400).json({
        error: 'Invalid form data'
      })
    }

    // VERIFY CLOUDFLARE TURNSTILE

    const captchaResponse =
      await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded'
          },

          body: new URLSearchParams({

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

    console.log(
      'Turnstile verification:',
      captchaData
    )

    if (!captchaData.success) {

      return res.status(400).json({
        error:
          'Captcha verification failed'
      })
    }

    // SAVE LEAD TO SUPABASE

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

      console.error(
        'SUPABASE ERROR:',
        error
      )

      return res.status(500).json({
        error:
          error.message
      })
    }

    // SEND EMAIL USING RESEND

    await resend.emails.send({

      from:
        'onboarding@resend.dev',

      to:
        'raanvixtechnologies@gmail.com',

      subject:
        'New Client Lead',

      html: `

        <div style="
          font-family: Arial;
          padding: 20px;
          background: #0f172a;
          color: white;
        ">

          <h2 style="color:#3b82f6;">
            New Client Lead
          </h2>

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

        </div>
      `
    })

    // SUCCESS RESPONSE

    return res.status(200).json({

      success: true,

      message:
        'Lead submitted successfully'
    })

  } catch (error) {

    console.error(
      'SERVER ERROR:',
      error
    )

    return res.status(500).json({

      error:
        error.message,

      stack:
        error.stack
    })
  }
}