 use utf8;
use strict;
use warnings;
use Text::CSV;
use JSON;

my $file = $ARGV[0] or die "Need to get CSV file on the command line\n";

my $sum = 0;
open(my $data, "<:encoding(utf8)", $file) or die "Could not open '$file' $!\n";

my $csv = Text::CSV->new({ sep_char => ',' });

my %R=();
my @K=();
my $i=0;

my $headline =  <$data>;
$csv->parse($headline);
@K = $csv->fields();

while(<$data>){
  $csv->parse($_) or die "fail :(";
  my @F = map {s/,//g; s/£//g; s/n\/a/0/; +$_} $csv->fields();
  for(3..$#F){
    my $e=($R{$K[$_]}||=[$F[$_], $F[$_]]);
    $e->[0]=($e->[0],$F[$_])[$e->[0]>$F[$_]];
    $e->[1]=($e->[1],$F[$_])[$e->[1]<$F[$_]];
  }
}

print JSON->new->encode(\%R);
