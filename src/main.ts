import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { join } from "path";
import { AllExceptionsFilter } from "./filter/all-exceptions.filter";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
        .setTitle("Flash Cards Project")
        .addBasicAuth({ type: "apiKey", name: "authorization", in: "header" })
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);

   // app.useGlobalFilters(new AllExceptionsFilter());

    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    app.enableCors();
    console.log("App running on " + (process.env.PORT ?? 3000));
    await app.listen(process.env.PORT ?? 3000);
}
console.log("........................");
bootstrap();
