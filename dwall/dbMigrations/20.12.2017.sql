ALTER TABLE users
CREATE TABLE `dWall`.`device_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `limit` INT NOT NULL,
  `is_multicast` TINYINT(1) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC));

ALTER TABLE `dWall`.`tv` 
ADD COLUMN `settings` INT NULL AFTER `orientation`,
ADD INDEX `fk_tv_settings_idx` (`settings` ASC);
ALTER TABLE `dWall`.`tv` 
ADD CONSTRAINT `fk_tv_settings`
  FOREIGN KEY (`settings`)
  REFERENCES `dWall`.`device_settings` (`id`)
  ON DELETE NO ACTION
  ON UPDATE NO ACTION;