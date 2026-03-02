import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Message } from '@arco-design/web-react';
import { IconLock, IconUser } from '@arco-design/web-react/icon';
import { authApi } from '@/api/auth';
import { useUserStore } from '@/stores/user';
import './Login.css';

const FormItem = Form.Item;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setToken } = useUserStore();
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const res: any = await authApi.login(values.username, values.password);
      setToken(res.token);
      Message.success('登录成功');
      navigate('/');
    } catch (error: any) {
      Message.error(error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card" bordered={false}>
        <div className="login-header">
          <h1>朱雀</h1>
          <p>轻量级定时任务管理平台</p>
        </div>
        <Form
          form={form}
          onSubmit={handleSubmit}
          autoComplete="off"
          layout="vertical"
          style={{ width: '100%' }}
        >
          <FormItem field="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input
              prefix={<IconUser />}
              placeholder="用户名"
              size="large"
              style={{ width: '100%' }}
            />
          </FormItem>
          <FormItem field="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<IconLock />}
              placeholder="密码"
              size="large"
              style={{ width: '100%' }}
            />
          </FormItem>
          <FormItem>
            <Button
              type="primary"
              htmlType="submit"
              long
              size="large"
              loading={loading}
              style={{ width: '100%' }}
            >
              登录
            </Button>
          </FormItem>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
