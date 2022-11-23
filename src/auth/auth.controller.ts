import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthDto } from "./dto";

@Controller("auth")
export class AuthController {
  constructor(private authServise: AuthService) { }

  @Post("signup")
  signup(@Body() dto: AuthDto) {
    return this.authServise.signup(dto)
  }

  @Post("signin")
  signin(@Body() dto: AuthDto) {
    return this.authServise.signin(dto)
  }
}