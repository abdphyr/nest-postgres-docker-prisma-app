import { ForbiddenException, Injectable } from "@nestjs/common";
import { User, Bookmark } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuthDto } from "./dto";
import * as argon from "argon2";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService
    ) { }
  public async signup(dto: AuthDto) {
    // generate the password hash
    const hash = await argon.hash(dto.password)
    // save the new user in db
    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          hash,
        }
      })
      // RETURN JWT TOKEN /////////////////////////////////////////////
      return this.signToken(user.id, user.email)

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ForbiddenException("Credentials taken")
        }
      }
      throw error
    }
  }
  public async signin(dto: AuthDto) {
    // find user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email
      }
    })
    if (!user) {
      throw new ForbiddenException("Credentials incorrect")
    }
    // compare password
    const pwMatches = await argon.verify(user.hash, dto.password)
    // if password incorrect throw exeption
    if (!pwMatches) {
      throw new ForbiddenException("Credentials incorrect")
    }
    //RETURN JWT TOKEN /////////////////////////////////////////////
    return this.signToken(user.id, user.email)
  }
  
  private async signToken(userId: number, email: string) {
    const payload = {
      sub: userId,
      email
    }
    const secret = this.config.get("JWT_SECRET")
    const token = await this.jwt.signAsync(payload, {
      expiresIn: "15m",
      secret
    })
    return {
      access_token: token
    }
  }
  
}
