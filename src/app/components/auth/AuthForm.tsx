import { useAuth } from "@/lib/auth/context";
import { authService } from "@/lib/auth/service";
import "@ant-design/v5-patch-for-react-19";
import { LockOutlined, MailOutlined, UserOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Divider } from "antd";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const AuthForm = () => {
  const router = useRouter();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const { message } = App.useApp();
  const [loginSuccess, setLoginSuccess] = useState(false);

  const toggleActiveTab = () => {
    setActiveTab(activeTab === "login" ? "register" : "login");
  };

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const firebaseUser = await authService.signIn(
        values.email,
        values.password
      );
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || undefined,
      });
      message.success("Login successful");
      setLoginSuccess(true);
    } catch (error: any) {
      message.error(authService.getAuthErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const firebaseUser = await authService.signInWithGoogle();
      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: firebaseUser.displayName || firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || undefined,
      });
      message.success("Google sign-in successful");
      setLoginSuccess(true);
    } catch (error: any) {
      message.error(authService.getAuthErrorMessage(error));
    } finally {
      setGoogleLoading(false);
    }
  };

  useEffect(() => {
    if (loginSuccess) {
      router.push("/");
    }
  }, [loginSuccess, router]);

  const handleRegister = async (values: {
    email: string;
    password: string;
    name: string;
  }) => {
    setLoading(true);
    try {
      const firebaseUser = await authService.createUser(
        values.email,
        values.password,
        values.name
      );

      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        displayName: values.name,
        photoURL: undefined,
      });
      message.success("Registration successful");
      setLoginSuccess(true);
    } catch (error: any) {
      const msg = authService.getAuthErrorMessage(error);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white p-8 rounded-lg border border-[var(--google-border)]">
        <div className="flex justify-center mb-8">
          <img
            src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_92x30dp.png"
            alt="Google"
            className="h-8"
          />
        </div>

        <h1 className="text-2xl font-normal text-center mb-2">
          {activeTab === "login" ? "Sign in" : "Create your Google Account"}
        </h1>
        <p className="text-center text-[var(--google-grey)] mb-8">
          {activeTab === "login"
            ? "Use your Google Account"
            : "Continue to Google Drive"}
        </p>

        <Button
          onClick={handleGoogleSignIn}
          loading={googleLoading}
          className="w-full mb-4 flex items-center justify-center h-10 border border-[var(--google-border)] rounded-md"
          icon={
            <img
              src="https://developers.google.com/identity/images/g-logo.png"
              alt="Google logo"
              className="h-5 mr-2"
            />
          }
        >
          <span>Sign in with Google</span>
        </Button>

        <Divider className="mb-4">
          <span className="text-[var(--google-grey)]">or</span>
        </Divider>

        <Form
          name="auth_form"
          onFinish={activeTab === "login" ? handleLogin : handleRegister}
          layout="vertical"
          requiredMark={false}
        >
          {activeTab === "register" && (
            <Form.Item
              name="name"
              rules={[
                { required: true, message: "Please enter your name" },
                { min: 2, message: "Name must be at least 2 characters" },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-[var(--google-grey)]" />}
                placeholder="Full name"
                className="google-input"
                size="large"
              />
            </Form.Item>
          )}

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-[var(--google-grey)]" />}
              placeholder="Email"
              className="google-input"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please enter your password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-[var(--google-grey)]" />}
              placeholder="Password"
              className="google-input"
              size="large"
            />
          </Form.Item>

          {activeTab === "register" && (
            <Form.Item
              name="confirmPassword"
              dependencies={["password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-[var(--google-grey)]" />}
                placeholder="Confirm password"
                className="google-input"
                size="large"
              />
            </Form.Item>
          )}

          <div className="flex justify-between items-center mb-6">
            <button
              type="button"
              onClick={toggleActiveTab}
              className="text-[var(--google-blue)] hover:bg-[var(--google-hover)] px-2 py-1 rounded"
            >
              {activeTab === "login" ? "Create account" : "Sign in instead"}
            </button>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="google-btn w-full"
              size="large"
            >
              {activeTab === "login" ? "Sign in" : "Create account"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default observer(AuthForm);
