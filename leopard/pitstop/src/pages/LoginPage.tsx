import { Button } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import { appName, appBrand } from '@/utils/config'
import './LoginPage.css'

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-logo">
        <img src="/logo.svg" alt="d.run" style={{ height: 56, objectFit: 'contain' }} />
      </div>

      <h1 className="login-title">{appName()}</h1>
      <p className="login-subtitle">{appBrand()} Operations Console</p>

      <Button
        className="login-btn"
        type="default"
        size="large"
        onClick={() => { window.location.href = '/api/v1/auth/login' }}
      >
        Continue with {appBrand()}
        <ArrowRightOutlined style={{ fontSize: 12 }} />
      </Button>
    </div>
  )
}
