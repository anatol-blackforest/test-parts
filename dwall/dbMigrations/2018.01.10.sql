CREATE TABLE `licenses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `singlecast` INT NOT NULL DEFAULT 0,
  `multicast` JSON NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `USER` (`user_id` ASC),
  CONSTRAINT `fk_licenses_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);

ALTER TABLE `licenses` 
CHANGE COLUMN `id` `id` INT(11) NOT NULL ,
ADD UNIQUE INDEX `user_id_UNIQUE` (`user_id` ASC);