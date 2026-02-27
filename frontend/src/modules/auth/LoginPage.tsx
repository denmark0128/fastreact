import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useLogin, useSignup } from './hooks'

const loginSchema = z.object({
  email: z.email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

const signupSchema = z
  .object({
    full_name: z.string().min(2, 'Full name is required'),
    department: z.string().min(2, 'Department is required'),
    email: z.email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirm_password: z.string().min(6, 'Confirm password is required'),
  })
  .refine((value) => value.password === value.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type SignupFormValues = z.infer<typeof signupSchema>

function LoginPage() {
  const navigate = useNavigate()
  const loginMutation = useLogin()
  const signupMutation = useSignup()

  const { control, handleSubmit, formState } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const {
    control: signupControl,
    handleSubmit: handleSignupSubmit,
    formState: signupFormState,
    reset: resetSignupForm,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      full_name: '',
      department: '',
      email: '',
      password: '',
      confirm_password: '',
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        navigate('/')
      },
    })
  }

  const onSignupSubmit = (values: SignupFormValues) => {
    signupMutation.mutate(
      {
        full_name: values.full_name,
        department: values.department,
        email: values.email,
        password: values.password,
      },
      {
        onSuccess: () => {
          resetSignupForm()
        },
      },
    )
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>HR Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {loginMutation.isError ? (
                <Alert className="mb-4 border-red-200 bg-red-50 text-red-700">Login failed. Please check credentials.</Alert>
              ) : null}

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Email</label>
                      <Input {...field} placeholder="admin@company.com" />
                      {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                    </div>
                  )}
                />

                <Controller
                  name="password"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Password</label>
                      <Input type="password" {...field} placeholder="********" />
                      {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                    </div>
                  )}
                />

                <Button className="w-full" type="submit" disabled={formState.isSubmitting || loginMutation.isPending}>
                  {loginMutation.isPending ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              {signupMutation.isError ? (
                <Alert className="mb-4 border-red-200 bg-red-50 text-red-700">
                  Account creation failed. Try another email.
                </Alert>
              ) : null}
              {signupMutation.isSuccess ? (
                <Alert className="mb-4 border-emerald-200 bg-emerald-50 text-emerald-700">
                  Account created. Use Login tab to sign in.
                </Alert>
              ) : null}

              <form className="space-y-4" onSubmit={handleSignupSubmit(onSignupSubmit)}>
                <Controller
                  name="full_name"
                  control={signupControl}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Full Name</label>
                      <Input {...field} placeholder="Jane Doe" />
                      {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                    </div>
                  )}
                />
                <Controller
                  name="department"
                  control={signupControl}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Department</label>
                      <Input {...field} placeholder="Engineering" />
                      {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                    </div>
                  )}
                />
                <Controller
                  name="email"
                  control={signupControl}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Email</label>
                      <Input {...field} placeholder="jane@company.com" />
                      {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                    </div>
                  )}
                />
                <Controller
                  name="password"
                  control={signupControl}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Password</label>
                      <Input type="password" {...field} placeholder="********" />
                      {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                    </div>
                  )}
                />
                <Controller
                  name="confirm_password"
                  control={signupControl}
                  render={({ field, fieldState }) => (
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Confirm Password</label>
                      <Input type="password" {...field} placeholder="********" />
                      {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                    </div>
                  )}
                />
                <Button className="w-full" type="submit" disabled={signupFormState.isSubmitting || signupMutation.isPending}>
                  {signupMutation.isPending ? 'Creating...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage
