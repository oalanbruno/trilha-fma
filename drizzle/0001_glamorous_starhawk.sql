CREATE TABLE `questionarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(255) NOT NULL,
	`email` varchar(320) NOT NULL,
	`respostas` text NOT NULL,
	`trilhaSugerida` text,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questionarios_id` PRIMARY KEY(`id`)
);
