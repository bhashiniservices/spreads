#!/bin/bash

export LEFT_CAM_MODEL="Canon EOS 600D"
export RIGHT_CAM_MODEL="Nikon DSC D3500"

setLeftCamConfig()
{
	gphoto2 --camera="$LEFT_CAM_MODEL" --set-config imageformat=0
	gphoto2 --camera="$LEFT_CAM_MODEL" --set-config imageformatsd=0
}

setRightCamConfig()
{
	gphoto2 --camera="$RIGHT_CAM_MODEL" --set-config imagequality=2
}

setLeftCamConfig
setRightCamConfig
